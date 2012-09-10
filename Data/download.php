<?php

function pre($text)
{
    return "<pre>\n" . $text . "\n</pre>\n";
}

// note that $original_file_path takes the full path (which can be just the file name if it's in the same directory as this script
// $output_file_name is just the resulting filename. It will necessarily be in sys_get_temp_dir().
// $header_line is an array
function insert_header($original_file_path, $output_file_name, $header_line)
{
    $temp = sys_get_temp_dir() . "/" . $output_file_name;
    rename(tempnam(sys_get_temp_dir(), "bud"), $temp);
    
    if (($temp_handle = fopen($temp, "w")) !== FALSE)
    {
        fputcsv($temp_handle, $header_line);
        if (($original_handle = fopen($original_file_path, "r")) !== FALSE)
        {
            while (($data = fgetcsv($original_handle, 4096, ",")) !== FALSE)
            {
                fputcsv($temp_handle, $data);
            }
            fclose($original_handle);
        }
        fclose($temp_handle);
    }
}

if (isset($_REQUEST['city']))
{
    $city = preg_replace("/[^0-9A-z.\-]/", "_", $_REQUEST['city']);

    $zip = new ZipArchive();
    $zip_file_name = $city . "_budget_data.zip";
    $zip_file_path = sys_get_temp_dir() . "/" . $zip_file_name;
    rename(tempnam(sys_get_temp_dir(), "bud"), $zip_file_path);

    if ($zip->open($zip_file_path, ZIPARCHIVE::CREATE)!==TRUE)
    {
        exit("cannot open <$zip_file_path>\n");
    }

    if ($city == 'paloalto')
    {
        $original_fin = $city . "_budgets.csv";
        $original_emp = $city . "_ftebudget.csv";

        $fin_output = $city . "_budget_financial.csv";
        $emp_output = $city . "_budget_employee.csv";
        
        $fin_header = array("year", "fund1", "fund2", "fund3", "fund4", "fund5", "dept1", "dept2", "dept3", "dept4", "dept5", "ledger1", "ledger2", "ledger3", "ledger4", "ledger5", "amount");
        $emp_header = array("year", "fund1", "fund2", "dept1", "dept2", "dept3", "dept4", "dept5", "title", "fte", "salary");
        
        insert_header($original_fin, $fin_output, $fin_header);
        insert_header($original_emp, $emp_output, $emp_header);
        
        
        $zip->addFile(sys_get_temp_dir() . "/" . $fin_output, $fin_output);
        $zip->addFile(sys_get_temp_dir() . "/" . $emp_output, $emp_output);
        
        $zip->close();
        
        header("Content-type: application/octet-stream");
        header("Content-disposition: attachment; filename=$zip_file_name");
        echo file_get_contents($zip_file_path);
    }
    else
    {
        echo "No data found for city:<br>\n$city";
    }
    

}

?>