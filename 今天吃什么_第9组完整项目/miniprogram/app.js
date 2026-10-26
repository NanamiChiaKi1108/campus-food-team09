const config = require('./config');
App({ onLaunch() { if(config.mode==='cloud') { if(!config.envId) throw new Error('请先填写云环境 envId'); wx.cloud.init({env:config.envId,traceUser:false}); } } });
