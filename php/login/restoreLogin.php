<?php
session_set_cookie_params(0, '/', '.legendhub.org', 1, 0);
session_start();

header( "Access-Control-Allow-Origin: legendhub.org" );
header( "Content-Type: application/json; charset=UTF-8" );

$root = realpath(getenv("DOCUMENT_ROOT"));
require_once("$root/php/common/config.php");
$pdo = getPDO();

$postdata = json_decode(file_get_contents("php://input"));
$loginToken = $postdata->loginToken;

$response->success = false;

// get hashed token for current IP
$query = $pdo->prepare("SELECT M.Id, PL.Username, PL.Token, M.Banned
						FROM PersistentLogins PL
							JOIN Members M ON M.Username = PL.Username
						WHERE PL.LoginIP = :ip");
$query->execute(array("ip" => getenv('REMOTE_ADDR')));

while ($res = $query->fetch(PDO::FETCH_OBJ)) {
	// check that token matches
	if (!$res->Banned && password_verify($loginToken, $res->Token)) {

		$_SESSION['Username'] = $res->Username;
		$_SESSION['UserId'] = $res->Id;

		$updateq = $pdo->prepare("UPDATE Members SET LastLoginDate = NOW(), LastLoginIP = :ip, LastLoginIPForward = :ipf WHERE Id = :id");
		$updateq->execute(array("id" => $res->Id, "ip" => getenv('REMOTE_ADDR'), "ipf" => getenv('HTTP_X_FORWARDED_FOR')));

		$response->success = true;
		$response->reason = "";
		$response->username = $res->Username;
		echo(json_encode($response));
		return;
	}
}

$response->reason = "failed";
echo(json_encode($response));
?>