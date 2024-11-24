<?php
// 清除輸出緩衝區以避免錯誤訊息等字符混入 JSON
ob_clean();

header('Content-Type: application/json');

$servername = "";
$username = "";
$password = "";
$dbname = "";

// 創建連接
$conn = new mysqli($servername, $username, $password, $dbname);


if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => '連接失敗: ' . $conn->connect_error]);
    exit;
}

$requestData = json_decode(file_get_contents('php://input'), true);
error_log("PHP: 收到請求數據: " . var_export($requestData, true));
$response = [];


// 上傳分數到資料庫
if (isset($requestData['nickname']) && isset($requestData['score'])) {
    $nickname = $conn->real_escape_string($requestData['nickname']);
    $score = (int)$requestData['score'];

    $sql = "INSERT INTO eatscores (nickname, score) VALUES ('$nickname', $score)";
    if ($conn->query($sql) === TRUE) {
        $response['message'] = '分數已成功上傳！';
        $response['success'] = true;
    } else {
        error_log("PHP: SQL 插入錯誤: " . $conn->error); // 記錄錯誤信息
        $response['success'] = false;
        $response['message'] = '上傳分數失敗';
    }
} else {
    $response['success'] = false;
    $response['message'] = '請提供暱稱和分數';
}



// 查詢排行榜
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['type']) && $_GET['type'] === 'leaderboard') {
    
    $sql = "SELECT nickname, score FROM eatscores ORDER BY id DESC LIMIT 10";
    $result = $conn->query($sql);

    $leaderboard = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $leaderboard[] = $row;
        }
        $response['success'] = true;
        $response['leaderboard'] = $leaderboard;
    } else {
        error_log("PHP: 查詢排行榜無結果");
        $response['message'] = '無數據';
    }
} else {
    $response['message'] = '請求類型或參數無效';
}
// 回傳完整的回應資料
echo json_encode($response);

$conn->close();
?>
