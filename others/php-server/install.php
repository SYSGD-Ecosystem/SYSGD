<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    echo "300";
    exit(0);
}


if (file_exists("config.php")) {
    echo "200";
} else if ($_SERVER['REQUEST_METHOD'] == 'POST' & isset($_POST["host"]) & isset($_POST["db_name"]) & isset($_POST["user"])) {

    $host = $_POST["host"];
    $db_name = $_POST["db_name"];
    $user = $_POST["user"];
    $password = $_POST["pass"];


    $connect = @new mysqli($host, $user, $password);
    $connect->select_db($db_name);


    if (isset($connect)) {
        writeConfigFile($host, $user, $db_name, $password);
        echo "200";
    } else {
        echo "400";
    }
} else {
    echo "300";
}


function writeConfigFile($host, $user, $db_name, $password)
{
    $config_file    = @fopen('config.php', "w");

    if (!$config_file) {

        return false;
    }

    $data   = "<?php\n";
    $data   .= "defined('DB_HOST') ? NULL : define('DB_HOST', '" . $host . "');\n";
    $data   .= "defined('DB_USER') ? NULL : define('DB_USER', '" . $user . "');\n";
    $data   .= "defined('DB_PASS') ? NULL : define('DB_PASS', '" . $password . "');\n";
    $data   .= "defined('DB_NAME') ? NULL : define('DB_NAME', '" . $db_name . "');\n";
    $data   .= "?>";

    // create the new file
    if (fwrite($config_file, $data)) {

        fclose($config_file);

        return true;
    }

    return false;
}
