"""Build the editable Markdown report into the existing Chinese PDF deliverable."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

ROOT=Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(TTFont('YaHei','C:/Windows/Fonts/msyh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('YaHeiBold','C:/Windows/Fonts/msyhbd.ttc',subfontIndex=0))
pdfmetrics.registerFontFamily('YaHei',normal='YaHei',bold='YaHeiBold',italic='YaHei',boldItalic='YaHeiBold')
green=colors.HexColor('#2f5b47')
styles={
 'body':ParagraphStyle('body',fontName='YaHei',fontSize=9.5,leading=16,spaceAfter=7,wordWrap='CJK',textColor=colors.HexColor('#26342d')),
 'title':ParagraphStyle('title',fontName='YaHeiBold',fontSize=27,leading=38,spaceAfter=18,textColor=green),
 'h1':ParagraphStyle('h1',fontName='YaHeiBold',fontSize=18,leading=27,spaceBefore=6,spaceAfter=13,keepWithNext=True,textColor=green),
 'h2':ParagraphStyle('h2',fontName='YaHeiBold',fontSize=13,leading=21,spaceBefore=14,spaceAfter=8,keepWithNext=True,textColor=green),
 'h3':ParagraphStyle('h3',fontName='YaHeiBold',fontSize=10.5,leading=18,spaceBefore=10,spaceAfter=7,keepWithNext=True,textColor=green),
 'cell':ParagraphStyle('cell',fontName='YaHei',fontSize=8.3,leading=13,wordWrap='CJK',textColor=colors.HexColor('#26342d')),
 'th':ParagraphStyle('th',fontName='YaHeiBold',fontSize=8.4,leading=13,wordWrap='CJK',textColor=colors.white),
}

def rich(text):
    text=escape(text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`([^`]+)`',r'\1',text)
    return text

width=A4[0]-96
def table(rows):
    n=len(rows[0])
    if n==2:
        widths=[105,width-105]
    elif n==3:
        widths=[66,148,width-214]
    elif n==4:
        widths=[56,96,width-200,48] if rows[0][0]=='食堂编号' else [62,110,154,width-326]
    else:
        widths=[width/n]*n
    data=[[Paragraph(rich(c),styles['th' if i==0 else 'cell']) for c in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),green),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f5f1'),colors.white]),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
        ('LINEBELOW',(0,0),(-1,0),0.5,green),('LINEBELOW',(0,1),(-1,-1),0.3,colors.HexColor('#dce5dd')),
    ]))
    return t

def footer(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#dce5dd'))
    canvas.line(48,36,A4[0]-48,36)
    canvas.setFont('YaHei',8)
    canvas.setFillColor(colors.HexColor('#728077'))
    canvas.drawString(48,23,'今天吃什么 · 第9组 · 1.3.1版 · 2026年10月26日')
    canvas.drawRightString(A4[0]-48,23,str(doc.page))
    canvas.restoreState()

lines=(ROOT/'docs/项目报告.md').read_text(encoding='utf-8').splitlines()
story=[]
i=0
while i<len(lines):
    text=lines[i].strip()
    if not text:
        i+=1
        continue
    if text.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r'[:\- ]+',c) for c in cells):
                rows.append(cells)
            i+=1
        story.append(table(rows))
        story.append(Spacer(1,10))
        continue
    heading=re.match(r'^(#{1,3})\s+(.+)$',text)
    if heading:
        level=len(heading[1])
        if not story:
            story.append(Spacer(1,24))
            style=styles['title']
        elif level==1:
            story.append(PageBreak())
            style=styles['h1']
        else:
            style=styles['h2' if level==2 else 'h3']
        story.append(Paragraph(rich(heading[2]),style))
    else:
        story.append(Paragraph(rich(text),styles['body']))
    i+=1
doc=SimpleDocTemplate(str(ROOT.parent/'项目说明与分工报告.pdf'),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=44,bottomMargin=52,title='今天吃什么 第9组项目说明与分工报告 1.3.1',author='第9组',pageCompression=1)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print('Built 项目说明与分工报告.pdf')
