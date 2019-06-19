/**
 * @file app
 * Created by haner on 2018/3/7.
 * @brief
 */


import $ from 'jquery';

import 'bootstrap/dist/css/bootstrap.css';

import Service, {REQUEST_CACHE} from './plugin/data-center';


let onceBtn = $('#onceBtn'), intervalBtn = $('#intervalBtn'), timeBtn = $('#timeBtn'), resultContainer = $('#result');

//注册请求池
Service.register({key: "GET_TOPICS_ONLY", url: "/weather?city=西安", type: 'get',only:true});
Service.register({key: "GET_TOPICS", url: "/weather?city=西安", type: 'get'});
Service.register({key: "TEST_INTERVAL", url: "/weather?city=西安", type: 'get', updateIntervalTime: 3});


//多次点击 触发一次请求
onceBtn.click(() => {
    resultContainer.empty();
    Service.get('GET_TOPICS_ONLY', {}, (resq, old) => render(resq.data))
});

intervalBtn.click(()=>{
    resultContainer.empty();
    Service.get('GET_TOPICS', {}, (resq, old) => render(resq.data))
});

timeBtn.click(() => {
    resultContainer.empty();
    Service.get('TEST_INTERVAL', {}, (resq, old) => render(resq.data))
});

let render = (data) => {
    const theme = ['primary', 'secondary', 'success', 'danger'];

    for (let i = 0; i < data.length; i++) {

        let idx = parseInt(Math.random() * (theme.length - 1));
        let dataItem = data[i];
        let item = $(`<div class="alert alert-${theme[idx]}" role="alert">${dataItem.title}</div>`);

        resultContainer.append(item);
    }
};

window.REQUEST_CACHE = REQUEST_CACHE;
