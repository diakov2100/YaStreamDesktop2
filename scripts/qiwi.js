const remote = require('electron').remote
$ = require('./jquery.js')
let pic = 1
var yastream = new yastreamAPI.apiRequests()
window.onload = function() {
    let back = document.getElementsByTagName('p')[0]
    back.onmouseover = function() {
        document.getElementsByTagName('img')[0].src = '../images/arrowActive.png'
        this.style.color = '#efbc38'
    }
    back.onmouseleave = function() {
        document.getElementsByTagName('img')[0].src = '../images/bitmap.png'
        this.style.color = '#979797'
    }
    let right = document.querySelector('.right-arrow')
    let left = document.querySelector('.left-arrow')
    let pag = document.querySelector('ol')
    let pic_house = document.querySelector('.image-house')
    back.onclick = function() {
        remote.getCurrentWindow().close()
    }
    right.onclick = () => {
        if (pic <= 3) {
            left.style.display = 'block'
            pic++
            pagination()
            if (pic == 3) {
                right.style.display = 'none'
            }
            pic_house.style.backgroundImage = 'url("../images/guide_' + pic + '.png")'
        }
    }
    left.onclick = () => {
        if (pic >= 1) {
            pic--
            let actives = document.querySelectorAll('.active')
            actives[actives.length - 1].classList.remove('active')
            if (pic == 2) {
                right.style.display = 'block'
            }
            if (pic == 1) {
                left.style.display = 'none'
            }
            pic_house.style.backgroundImage = 'url("../images/guide_' + pic + '.png")'
        }
    }
    let pagination = function() {
        let temp = 1
        for (i = 1; i < pag.childNodes.length; i = i + 2) {
            if (temp <= pic) {
                temp++
                pag.childNodes[i].classList.add('active')
            }
        }
    }
    let enter = document.querySelector('.btn')
    enter.onclick = () => {
        console.log($('#token').val())
        if ($('#token').val() != "Введите Ваш токен здесь") {
            
            yastream.qiwiAuth($('#token').val() , function() {
                    remote.getCurrentWindow().close();
            })
        }
    }
}