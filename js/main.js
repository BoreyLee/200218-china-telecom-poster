/**
 *@author BoreyLee
 *@mail 475773037@qq.com
 *@date 2020/2/19
 */
var apiUrl = 'http://nj.pflm.cn/njTelecomPost';
var apiList = {
    userInfo: apiUrl + '/initialData.do',
    uploadQrCode: apiUrl + '/uploadQR.do',
    uploadPoster: apiUrl + '/createPost.do'
};
var weuiLoading = null;
var editor = null;//图片编辑器
var swiper = null;//轮播
var userToken = null;
var qrData = null;
var isPopup = false;
$(document).ready(function () {
    console.log("ver:2.4");
    //--创建页面监听，等待微信端页面加载完毕 触发音频播放
    audioAutoPlay();
    initData();
    initEvent();
});

function initData() {
    userToken = getUrlParam('userToken');
    // if (userToken) {
    //     getUserInfo(userToken);
    // }
    swiper = new Swiper("#SwiperContainer", {
        direction: "vertical",
        preloadImages: true,
        updateOnImagesReady: true,
        initialSlide: 0,
        effect: 'fade',
        noSwipingClass: 'stop-swiping'
    });
    editor = new mo.ImageEditor({
        trigger: $('#createFile'),
        container: $('#editBox'),
        width: 441,
        height: 784,
        stageX: $('#editBox')[0].offsetLeft,
        fileComplete: function () {
            if (!isPopup) {
                $('.popup-box').fadeIn();
                isPopup = true;
            }
        }
    });
    $("#qrcodeFile").on('change', function (e) {
        lrz(this.files[0], {width: 800, height: 800})
            .then(function (rst) {
                var base64 = rst.base64;
                var uploadPic = new Image();
                uploadPic.src = base64;
                uploadPic.onload = function (e) {
                    // request(apiList.uploadQrCode, 'POST', {
                    //     userToken: userToken,
                    //     QR: base64
                    // }, true, function (result) {
                    var loading = weui.loading('提交中...');
                    setTimeout(function () {
                        loading.hide(function () {
                            qrData = base64;
                            $('#qrImg').attr("src", qrData);
                            $('.home-cxt').css({display: 'none'});
                            $('.result-cxt').css({display: 'flex'});
                        });
                    }, 800);
                    // });
                }
            });
    });
}

function getUserInfo(token) {
    weuiLoading = weui.loading('加载中...');
    $.ajax({
        url: apiList.userInfo,
        type: 'get',
        data: {userToken: token},
        dataType: "jsonp",  //预期的服务器响应的数据类型。
        contentType: "application/json",
        success: function (res) {
            weuiLoading.hide();
            if (res.code == 1) {
                qrData = res.QR;
                if (qrData) {
                    $('.home-cxt .btn-start').show();
                    $('.home-cxt .btn-upload1').addClass('again');
                    $('#qrImg').attr("src", qrData);
                }
            } else {
                weui.toast(res.msg, {className: 'weui-warn'});
            }
        },
        error: function () {
            weuiLoading.hide();
        }
    });
}


function initEvent() {
    $('.btn-create').on('touchend', function () {
        if (editor) {
            if (editor.imgs && editor.imgs.length > 0) {
                editor.toDataURL(onSaveImage);
            } else {
                weui.toast('请添加图片!', {className: 'weui-warn'});
            }
        }
    });
    $('.btn-close').on('touchend', function () {
        $('.popup-box').fadeOut();
    });

    $('.btn-upload2,.btn-start').on('touchend', initEditImage);

    $('.btn-sound').on('touchend', onHandleSound);

    $('.btn-again').on('touchend', function () {
        $('.section-edit').removeClass('edit-show');
        $('.result-cxt').css({display: 'none'});
        $('.home-cxt').css({display: 'flex'});
        swiper.slideTo(0, 500);
    })

}

function initEditImage() {
    if (editor && qrData) {
        editor.addImage({img: document.querySelector('#qrImg'), disTop: true, disRotate: true, disY: true});
    }
    $('.section-edit').addClass('edit-show')
}

/**保存图片*/
function onSaveImage(data) {
    // request(apiList.uploadPoster, 'POST', {userToken: userToken, userPic: data}, true, function (result) {
    //     if (result.postId) {
    // shareDatas.lineLink += "?postId=" + result.postId;
    // resetShareDatas();
    var loading = weui.loading('生成中...');
    setTimeout(function () {
        loading.hide(function () {
            editor.clear();
            $('.section-edit').removeClass('edit-show');
            $('#posterBox').html('<img src="' + data + '" alt="">');
            swiper.slideTo(1, 500);
        });
    }, 800);
    //     } else {
    //         weui.toast('上传失败!', {className: 'weui-warn'});
    //     }
    // });
}

function request(sUrl, sType, oData, loading, fnSuc) {
    if (loading) weuiLoading = weui.loading('提交中...');
    $.ajax({
        url: sUrl,
        data: oData,
        type: sType,
        dataType: "json",
        async: true,
        success: function (result) {
            if (weuiLoading) weuiLoading.hide();

            if (result["code"] == 1) {
                if (fnSuc) fnSuc.call(null, result);
            } else {
                weui.toast(result["msg"], {className: 'weui-warn'});
            }
        },
        error: function () {
            if (weuiLoading) weuiLoading.hide();
            weui.toast('网络异常!', {className: 'weui-warn'});
        }
    });
}

function getUrlParam(name) {
    var val = null,
        reg = new RegExp('[\\?&]' + name + '=([^&]+)', 'i');
    if (reg.test(document.location.search)) {
        val = RegExp.$1;
    }
    return val ? decodeURIComponent(val) : null;
}

function audioAutoPlay() {
    var audio = document.getElementById('audio');
    if (audio) {
        audio.play();
    }
    document.addEventListener("WeixinJSBridgeReady", function () {
        if (audio) {
            audio.play();
        }
    }, false);
}

function onHandleSound() {
    var audio = document.getElementById('audio');
    if (audio.paused) {
        if (audio) {
            audio.play();
        }
        $('.btn-sound').removeClass('sound-close');
    } else {
        if (audio) {
            audio.pause();
        }
        $('.btn-sound').addClass('sound-close');
    }
}
