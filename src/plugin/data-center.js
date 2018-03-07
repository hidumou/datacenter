const $ = require('jquery');

const EMPTY_PARAM_KEY = JSON.stringify({"": ""});

const UPDATE_INTERVAL_TIME = 1000; //更新 间隔时间 1秒

export const REQUEST_CACHE = {}; //API请求池

const DataCenter = {

    api: "/api/v1",

    register: function (setting) {
        this.validate(setting) && this.init(setting);
    },

    //校验参数完整性
    validate: function (setting) {
        return true;
    },

    init: function (settings) {
        let updateIntervalTime = Math.abs(settings.updateIntervalTime)

        REQUEST_CACHE[settings.key] = {
            api: settings.api || this.api,
            url: settings.url,
            key: settings.key,
            dataType: settings.dataType ? settings.dataType : "json",
            type: settings.type ? settings.type : "post",
            updateIntervalTime: updateIntervalTime > 0 ? settings.updateIntervalTime : 0,//更新数据 间隔时间 秒
            ajaxInstances: {},//存储不同参数的请求实例 e.g. ?a=1  ?a=2&b=2
        };

        // this.createAjaxConfig(settings.key, JSON.stringify(EMPTY_PARAM_KEY));
    },

    //不同参数 不同请求实例
    createAjaxConfig: function (key, paramKey) {
        REQUEST_CACHE[key].ajaxInstances[paramKey] = this.defaultAjaxConfig();
    },

    //默认设置
    defaultAjaxConfig: function () {
        return {
            instance: null,//Ajax实例
            data: null,
            oldData: null,
            isLoading: false,
            timestamp: this.timestamp(),//请求时间戳，便于后面进行时间间隔控制
            callbacks: [],//回调池,
            requestData: {},//请求携带数据
        };
    },

    //获取时间戳
    timestamp: function () {
        return new Date().getTime();
    },

    has: function (key) {
        return undefined !== REQUEST_CACHE[key];
    },

    gather: function (key, params, callback) {
        let paramKey = EMPTY_PARAM_KEY;

        if (!$.isEmptyObject(params)) {
            paramKey = JSON.stringify(params);
        }

        let ins = REQUEST_CACHE[key].ajaxInstances[paramKey];

        //没有获取到 对应参数 所创建的实例配置，则重新生成
        !ins && this.createAjaxConfig(key, paramKey);

        REQUEST_CACHE[key].ajaxInstances[paramKey].requestData = params;

        //将多次请求的回调 先 存放在对应的回调池
        REQUEST_CACHE[key].ajaxInstances[paramKey].callbacks.push(callback);

        return paramKey;
    },

    //获取数据
    request: function (key, paramKey) {

        let ajaxBaseConfig = REQUEST_CACHE[key];
        let ajaxInstance = ajaxBaseConfig.ajaxInstances[paramKey];

        if (!ajaxInstance.isLoading) {
            ajaxInstance.isLoading = true;
            let self = this;

            let options = {
                url: ajaxBaseConfig.api + ajaxBaseConfig.url,
                type: ajaxBaseConfig.type,
                dataType: ajaxBaseConfig.dataType,
                xhrFields: {withCredentials: true},
                crossDomain: true,
                success: function (resp) {
                    self.setData(key, paramKey, resp);
                    self.dispatch(key, paramKey);
                    self.reset(key, paramKey);
                },
                error: function (jqXHR, statuObj, error) {
                    self.reset();
                }
            };
            ajaxInstance.instance = $.ajax(options);
        }

    },

    //设置 旧数据 与 新数据
    setData: function (key, paramKey, data) {
        REQUEST_CACHE[key].ajaxInstances[paramKey].oldData = REQUEST_CACHE[key].ajaxInstances[paramKey].data;
        REQUEST_CACHE[key].ajaxInstances[paramKey].data = data;
    },

    //Ajax 实例状态重置
    reset: function (key, paramKey) {
        let ins = REQUEST_CACHE[key].ajaxInstances[paramKey];

        ins.timestamp = this.timestamp();
        ins.isLoading = false;
        ins.instance = null;

    },

    //数据分发
    dispatch: function (key, paramKey) {
        let ins = REQUEST_CACHE[key].ajaxInstances[paramKey];
        while (ins.callbacks.length) {
            ins.callbacks.shift()(ins.data, ins.oldData);
        }
    },

    get: function (key, params, callback) {
        let paramKey = this.gather(key, params, callback);

        let ins = REQUEST_CACHE[key].ajaxInstances[paramKey];

        console.log(ins.callbacks.length);

        //第一次请求，并且未拿到数据
        if (ins.callbacks.length === 1 && null === ins.data) {
            this.request(key, paramKey);
        }
        //请求数据未获取到时，再次请求，(防止多次点击)
        else if (1 < ins.callbacks.length) {
            this.request(key, paramKey);
        }
        //超过指定时间后可以更新数据
        else if (REQUEST_CACHE[key].updateIntervalTime > 0 && (this.timestamp() - ins.timestamp > REQUEST_CACHE[key].updateIntervalTime * UPDATE_INTERVAL_TIME)) {
            this.request(key, paramKey);
        }
        else {
            this.dispatch(key, paramKey);
        }

    },

    update: function (key, params, callback) {

    },

    save: function (key, params, callback) {

    }
};

export default DataCenter;
