// 全局變量
let canvas, ctx;
let score = 0;

// 遊戲初始化
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    const faceImage = new Image();
    faceImage.src = 'image/face.png';

    const foodImage = new Image();
    foodImage.src = 'image/food.png';

    let face = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 100,
        height: 100,
        rotation: 0
    };

    let foods = [];
    let gameDuration = 120000; //遊戲時間 120 秒
    let startTime = Date.now();
    let gameLoopId;
    let foodCreationInterval;
    let gameActive = true;

    // 每秒生成一個食物
    function startFoodCreation() {
        foodCreationInterval = setInterval(createFood, 1000); 
    }

    
    function update() {
        if (!gameActive) return;

        for (let i = 0; i < foods.length; i++) {
            let food = foods[i];
            food.x += food.speedX;
            food.y += food.speedY;
            if (food.status === 'none' && isInBlueArea(face, food)) {
                food.status = 'blue';
            } else if (food.status === 'blue' && isInYellowArea(face, food)) {
                score++;
                const foodDisappearSound = new Audio('sound/click.mp3');
                foods.splice(i, 1);
                foodDisappearSound.play();
                i--;
            }
        }

        if (Date.now() - startTime > gameDuration) {
            endGame();
        }
    }

    function isInBlueArea(face, food) {
        const { mouthLeftX, mouthTopY, mouthWidth, mouthHeight } = getScoreBoxDimensions(face);

        // 食物坐標旋轉到臉部的坐標系
        let rotatedFood = rotatePoint(food.x, food.y, face.x, face.y, -face.rotation);

        return (
            rotatedFood.x > face.x - face.width / 2 + mouthLeftX &&
            rotatedFood.x < face.x - face.width / 2 + mouthLeftX + mouthWidth &&
            rotatedFood.y > face.y - face.height / 2 + mouthTopY + mouthHeight / 2 &&
            rotatedFood.y < face.y - face.height / 2 + mouthTopY + mouthHeight
        );
    }

    function isInYellowArea(face, food) {
        const { mouthLeftX, mouthTopY, mouthWidth, mouthHeight } = getScoreBoxDimensions(face);

        // 食物坐標旋轉到臉部的坐標系
        let rotatedFood = rotatePoint(food.x, food.y, face.x, face.y, -face.rotation);

        return (
            rotatedFood.x > face.x - face.width / 2 + mouthLeftX &&
            rotatedFood.x < face.x - face.width / 2 + mouthLeftX + mouthWidth &&
            rotatedFood.y > face.y - face.height / 2 + mouthTopY &&
            rotatedFood.y < face.y - face.height / 2 + mouthTopY + mouthHeight / 2
        );
    }

    function rotatePoint(px, py, ox, oy, angle) {
        // 旋轉公式
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);

        // 將點旋轉到新的坐標系
        let nx = cos * (px - ox) - sin * (py - oy) + ox;
        let ny = sin * (px - ox) + cos * (py - oy) + oy;

        return { x: nx, y: ny };
    }

    // 調整判定得分區域
    function getScoreBoxDimensions(face) {
        const mouthWidth = face.width / 2.5 * 1.2;
        const mouthHeight = face.height / 8 * 5;
        const mouthOffsetY = face.height / 3;

        const mouthCenterX = face.width / 2;
        const mouthCenterY = face.height / 2 + mouthOffsetY;
        const mouthLeftX = mouthCenterX - (mouthWidth / 2);
        const mouthTopY = mouthCenterY - (mouthHeight / 2);

        return { mouthLeftX, mouthTopY, mouthWidth, mouthHeight };
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(face.x, face.y);
        ctx.rotate(face.rotation);
        ctx.drawImage(faceImage, -face.width / 2, -face.height / 2, face.width, face.height);
        ctx.restore();

        for (let food of foods) {
            ctx.drawImage(foodImage, food.x - food.size / 2, food.y - food.size / 2, food.size, food.size);
        }

        let elapsedTime = Date.now() - startTime;
        let remainingTime = Math.max(0, gameDuration - elapsedTime);
        let seconds = Math.ceil(remainingTime / 1000);

        ctx.font = '30px Shippori Mincho';
        ctx.fillStyle = 'black';
        ctx.fillText(`剩餘時間: ${seconds}`, 10, 30);
        ctx.fillText(`餵食數: ${score}`, 10, 70);

        //drawScoreBox(); // 顯示得分判定框
    }

    function createFood() {
        let side = Math.floor(Math.random() * 4);
        let x, y;

        if (side === 0) {
            x = Math.random() * canvas.width;
            y = 0;
        } else if (side === 1) {
            x = canvas.width;
            y = Math.random() * canvas.height;
        } else if (side === 2) {
            x = Math.random() * canvas.width;
            y = canvas.height;
        } else {
            x = 0;
            y = Math.random() * canvas.height;
        }

        let angle = Math.atan2(face.y - y, face.x - x);
        let speed = 2 + Math.random() * 3;

        let food = {
            x: x,
            y: y,
            size: 20,
            speedX: speed * Math.cos(angle),
            speedY: speed * Math.sin(angle),
            status: 'none' // 食物的狀態初始化
        };
        foods.push(food);
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(gameLoopId);
        clearInterval(foodCreationInterval);

        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        finalScore.textContent = `餵食結束！你給涼子吃了 ${score} 個食物！`;
        gameOverScreen.style.display = 'flex';
    }

    function drawScoreBox() {
        const { mouthLeftX, mouthTopY, mouthWidth, mouthHeight } = getScoreBoxDimensions(face);

        // 繪製判定框
        ctx.save();
        ctx.translate(face.x, face.y);
        ctx.rotate(face.rotation);

        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(-face.width / 2 + mouthLeftX, -face.height / 2 + mouthTopY, mouthWidth, mouthHeight / 2);

        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fillRect(-face.width / 2 + mouthLeftX, -face.height / 2 + mouthTopY + mouthHeight / 2, mouthWidth, mouthHeight / 2);

        ctx.restore();
    }

    function gameLoop() {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    startFoodCreation(); // 啟動食物生成
    gameLoop();

    document.getElementById('backButton').addEventListener('click', () => {
        document.getElementById('shareScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'flex';
    });

    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        updateFaceRotation(mouseX, mouseY);
    });

    function updateFaceRotation(mouseX, mouseY) {
        const angle = Math.atan2(mouseY - face.y, mouseX - face.x);
        face.rotation = angle;
    }
});

// 遊戲截圖功能
const shareImage = new Image();
shareImage.crossOrigin = 'Anonymous';
shareImage.src = 'image/share.png';

function captureScreenshotWithScore(callback) {
    try {
        const screenshotCanvas = document.createElement('canvas');
        screenshotCanvas.width = canvas.width;
        screenshotCanvas.height = canvas.height;
        const screenshotCtx = screenshotCanvas.getContext('2d');

        if (shareImage.complete) {
            drawImageWithScore();
        } else {
            shareImage.onload = drawImageWithScore;
        }

        function drawImageWithScore() {
            screenshotCtx.drawImage(shareImage, 0, 0, canvas.width, canvas.height);

            screenshotCtx.font = 'bold 60px Shippori Mincho'; 
            screenshotCtx.fillStyle = 'black';

            const text = `涼子今天吃了 ${score} 個食物`;
            const textWidth = screenshotCtx.measureText(text).width;

            const textX = (canvas.width - textWidth) / 2;
            const textY = canvas.height / 2; 

            screenshotCtx.fillText(text, textX, textY);

            const dataUrl = screenshotCanvas.toDataURL('image/png');
            callback(dataUrl);
        }
    } catch (error) {
        console.error('產生截圖失敗:', error);
    }
}


// 按鈕動畫與音效
document.querySelectorAll('.bubbly-button').forEach(button => {
    button.addEventListener('mouseover', () => {
        const buttonHoverSound = new Audio('sound/hover.mp3');
        buttonHoverSound.play();
    });
});

var animateButton = function(e, callback) {
    e.preventDefault();
    const buttonClickSound = new Audio('sound/click.mp3');
    buttonClickSound.play();
    e.target.classList.remove('animate');
    e.target.classList.add('animate');
    setTimeout(function(){
        e.target.classList.remove('animate');
        if (callback) callback();
    }, 700);
};
var bubblyButtons = document.getElementsByClassName("bubbly-button");
for (var i = 0; i < bubblyButtons.length; i++) {
    bubblyButtons[i].addEventListener('click', function(e) {
        animateButton(e, function() {
            if (e.target.id === 'restartButton') {
                window.location.reload();
            } else if (e.target.id === 'screenshotButton') {
                captureScreenshotWithScore((screenshotUrl) => {
                    const link = document.createElement('a');
                    link.href = screenshotUrl;
                    link.download = '涼子餵食記錄.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            } else if (e.target.id === 'shareButton') {
                // 生成分享的文字和網址並複製
                const url = window.location.href;
                navigator.clipboard.writeText(url)
                    .then(() => {
                        alert('網址已複製！');
                    })
                    .catch((err) => {
                        console.error('複製失敗: ', err);
                    });
            }
        });
    }, false);
}

let hasUploaded = false; // 檢查是否上傳過紀錄

document.getElementById('uploadScoreButton').addEventListener('click', () => {
    if (hasUploaded) {
        alert('分數已上傳，請勿重複操作！');
        return;
    }

    const nickname = document.getElementById('nicknameInput').value.trim();
    if (!nickname) {
        alert('請輸入暱稱！');
        return;
    }

    fetch('./upload_score.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname: nickname, score: score })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('分數已成功上傳！');
            hasUploaded = true;
            document.getElementById('uploadScoreButton').disabled = true;
        } else {
            alert('上傳失敗，請稍後再試！');
        }
    })
    .catch(error => {
        console.error('上傳分數失敗:', error);
        alert('發生錯誤，無法上傳分數。');
    });
});


// 查詢排行榜
document.getElementById('leaderboardButton').addEventListener('click', () => {
    fetch('./upload_score.php?type=leaderboard', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.innerHTML = '';
            data.leaderboard.forEach(entry => {
                const listItem = document.createElement('li');
                listItem.textContent = `暱稱：${entry.nickname} 餵食數：${entry.score}`;
                leaderboardList.appendChild(listItem);
            });
            document.getElementById('leaderboardScreen').style.display = 'block';
        } else {
            alert('無法加載排行榜數據！');
        }
    })
    .catch(error => {
        console.error('查詢排行榜失敗:', error);
        alert('發生錯誤，無法查詢排行榜。');
    });
});

// 關閉排行榜
document.querySelector('.closeLeaderboard').addEventListener('click', () => {
    document.getElementById('leaderboardScreen').style.display = 'none';
});


