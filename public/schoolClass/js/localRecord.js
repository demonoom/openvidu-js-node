const electron = window.parent.require('electron');
const {shell} = electron;
const {dialog} = window.parent.require('electron').remote;
const fs = window.parent.require('fs');
var rootDir = '/home/fanbo/视频';
var fileNames = [];
// console.log(shell,'shell');
// console.log(electron);
// console.log(fs);

var listArray = [
//     {
//     fileName:'传统民居',
//     filePath:'../js/jquery.js',
//     fileTime:'05:00:03',
//     fileSize:'4.5MB',
//     fileType:'微课'
// },{
//     fileName:'现代民居',
//     filePath:'../js/jquery.js',
//     fileTime:'03:22:17',
//     fileSize:'7.7MB',
//     fileType:'本地课堂'
// }
];

$(function () {
    $('.list_body').empty();
    loadFiles();

});


//根据根目录遍历渲染文件
function loadFiles(){
    //置空
    console.log($('.list_body'),'已清空的');
    // console.log($('.list_body').html(),'')
    $('#dir_input').val(rootDir);
    fs.readdirSync(rootDir).map((value, index) => {
        fileNames.push(value);
    })
    fileNames.map((value, index) => {
        // console.log(rootDir+'/'+value,'文件路径')
        var stats = fs.statSync(rootDir + '/' + value);
        // console.log(stats,'stats');
        var type = (stats.size / 1024 / 1024).toFixed(2) > 10 ? '本地课堂' : '微课';
        console.log(value, '文件名称');
        console.log((stats.size / 1024 / 1024).toFixed(2), '文件大小');
        console.log(type, '类型');
        console.log(rootDir, '文件夹位置');
        console.log(rootDir + '/' + value, '文件位置');
        var obj = {
            fileName: value,
            filePath: rootDir + '/' + value,
            fileDirPath: rootDir,
            fileTime: '03:22:17',
            fileSize: (stats.size / 1024 / 1024).toFixed(2) + 'MB',
            fileType: type
        };
        listArray.push(obj);
    });
    //将file对象渲染至页面
    if (listArray.length == 0) {
        $('.list_body').append("<div class='empty'>本地暂无文件</div>")
    } else {
        //遍历当前目录下的文件
        listArray.map((value, index) => {
            appendToList(value);
        })
    }
}


function openFile(path) {
    console.log('打开文件');
}

function openFolder(path) {
    console.log('打开文件夹');
    shell.openItem(rootDir,function(err){
        console.log(err);
    });
}

/*
 ** 添加对象至list_body元素中
 */
function appendToList(obj) {
    var html = '<div class="list_item">' +
        '<div class="list_bodyItem">' + obj.fileName + '</div>' +
        '<div class="list_bodyItem">' + obj.fileType + '</div>' +
        '<div class="list_bodyItem">' + obj.fileTime + '</div>' +
        '<div class="list_bodyItem">' + obj.fileSize + '</div>' +
        '<div class="list_bodyItem">' +
        '     <button onclick="openFile()">播放</button>' +
        '     <button onclick="openFolder()">打开文件夹</button>' +
        '</div></div>';
    $('.list_body').append(html);
}

$('#updateDir').on('click',function(){
    console.log('更改文件夹路径');

    dialog.showOpenDialog({ properties: ['openDirectory']},function(res){
        console.log(res[0]);
        rootDir = res[0];
        //重新渲染
        fileNames.splice(0);
        listArray.splice(0)
        $('#dir_input').val(rootDir);
        $('.list_body').empty();
        loadFiles();
    })

})