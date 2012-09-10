<?php
$rightMargin = 20;
$titleSpace = 70;
$titleLeftMargin = 40;

$backgroundColor = '#FFFFFF';
$foregroundColor = '#000000';
$highlightColor = '#00B0EA';

function getTextByXpath($expression, $xmlText){
        $doc = new DOMDocument();
        @$doc->loadHTML($xmlText);
        //evaluate xpath expression and return DomElement[]
        $xpath = new Domxpath($doc);
        $elementNodes = $xpath->query($expression);
        //convert these DOM elements to strings for mixed-mode searching
        $result = array();
        foreach($elementNodes as $elementNode){
            $string = Automaton::dumpXML($elementNode);
            $result[] = $string;
        }
        return $result; //return string[]
}

function startsWith($haystack, $needle){
    $length = strlen($needle);
    return (substr($haystack, 0, $length) === $needle);
}

$legendSpace = 500;

$fontHeight = 14;
$colorWidth = 8;
$colorHeight = 32;
$textColorspacing = 3;
$topSpace = 20;
$fontWeight = 600;

// All the request data
$svgdata = urldecode($_REQUEST['svgdata']);

// Massage svg data from IE
$svgdata = preg_replace(',(xmlns="http://www.w3.org/2000/svg.*)(xmlns="http://www.w3.org/2000/svg"),', '$1', $svgdata);
$svgdata = preg_replace(',(defs[^/]*)/>,', '$1></defs>', $svgdata);
$svgdata = preg_replace(',/\>,', '></path>', $svgdata);
//echo $svgdata;
//die();
//$svgdata = preg_replace('~<text ~', '<text font-weight="'.$fontWeight.'" ', $svgdata);
//$svgdata = preg_replace('~Arial~', 'Palatino', $svgdata);
$svgdata = preg_replace('~fill="#a5a8ab"~', 'fill="'.$foregroundColor.'"', $svgdata);
$svgdata = preg_replace('~fill="#cccccc"~', 'fill="'.$foregroundColor.'"', $svgdata);

$svgtitle = urldecode($_REQUEST['svgtitle']);
$svgPieYear = urldecode($_REQUEST['svgpieyear']);
$svglegend = json_decode($_REQUEST['svglegend'], true); //don't allow it to return stdClass BS
$parts = preg_split('~(</?[\w][^>]*>)~', $svgtitle, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

$svgtemp = tempnam(sys_get_temp_dir(), "SVG"); // create a new temp file
rename($svgtemp, $svgtemp . ".svg");           // rename the temp file to have a ".svg" extension so imagick knows what to do with it
$svgtemp .= ".svg";                            // update our filename variable

// Write the svg to file 
// TODO: Is this necessary? Reading the image directly from svgdata didn't seem
// to work
file_put_contents($svgtemp, $svgdata);


// The graph image
$image = new imagick();
$image->setBackgroundColor($backgroundColor);
$image->readImage($svgtemp);

// Graph image dimensions
$imageG = $image->getImageGeometry();

$canvasWidth = $imageG['width'] + $legendSpace;
$canvasHeight = max($imageG['height'] + $titleSpace, $topSpace + count($svglegend) * ($colorHeight));

// The canvas everything will be rendered to (the graph, title, and legend)
$canvas = new imagick();
$canvas->newImage($canvasWidth, $canvasHeight, new ImagickPixel($backgroundColor));
$canvas->compositeImage($image, imagick::COMPOSITE_DEFAULT, 0, $titleSpace);

// Draw the title
$draw = new ImagickDraw();
$xOffset = 0;
$yOffset = 0;
$height;
$width = 0;
$widths = Array();
$draw->setfont('Times-Bold');
foreach($parts as $part){
    if(startsWith($part, '<span')|| startsWith($part, '</span')) continue;
    else if(startsWith($part, '<br')){
        array_push($widths, $width);
        $width = 0;
    }else{
        $metrics = $canvas->queryFontMetrics( $draw, $part);
        $width += $metrics['textWidth'];
    }
}
if($width != 0){
    array_push($widths, $width);
    $width = 0;
}
$width = array_shift($widths);
if($svgPieYear){
    array_push($parts, '<br/>');
    array_push($parts, ''.$svgPieYear);
    $titleLeftMargin = $titleLeftMargin -40;
}
foreach($parts as $part){
    if(startsWith($part, '<span')){
        $draw->setFillColor($highlightColor);
    }else if(startsWith($part, '</span')){
        $draw->setFillColor($foregroundColor);
    }else if(startsWith($part, '<br')){
        $yOffset += $height;
        $xOffset = 0;
        $width = array_shift($widths);
    }else{
        $metrics = $canvas->queryFontMetrics( $draw, $part);
        if($part == end($parts)) $titleLeftMargin = $titleLeftMargin-10;
        $canvas->annotateImage($draw, $imageG['width']/2 + $titleLeftMargin + $xOffset - ($width/2), $titleSpace/2 + $yOffset, 0, $part);
        if($metrics['textHeight'] && !$height){
            $height = $metrics['textHeight'];
        }
        $xOffset += $metrics['textWidth'];
    }
}

$draw->setFillColor($foregroundColor);
$draw->setFontSize(16);
$draw->setTextAlignment(2);


$draw->setFontSize($fontHeight);
$draw->setFontWeight(600);
$draw->setTextAlignment(2);

$i = 0;
$x = 0;
$y = 0;
// TODO indent for $legend->depth
foreach ($svglegend as $legend) {
    
     //print_r($legend); exit();
     if ($legend['color'] != 'none') {
          $draw->setFillColor('#'.str_pad(dechex($legend['color']), 6, '0', STR_PAD_LEFT));
     } else {
          $color = new ImagickPixel('black');
          $draw->setFillColor('#FFFFFF');
     }
     $draw->setTextAlignment(1);
     $draw->rectangle(
         $imageG['width'],
         $topSpace + $i * $colorHeight,
         $imageG['width'] + $colorWidth,
         $topSpace + $i * $colorHeight + $colorHeight);

     $canvas->drawImage($draw);

     $draw->setFillColor($foregroundColor);
     $canvas->annotateImage(
        $draw,
        $imageG['width'] + $colorWidth + $textColorspacing,
        $topSpace + $i * $colorHeight + ($colorHeight - $fontHeight),
        0,
        $legend['text']
     );
     $metrics = $canvas->queryFontMetrics( $draw, $legend['text']);
     $textExtentX = $metrics['textWidth'] + $imageG['width'] + $colorWidth + $textColorspacing;
     $textExtentY = $metrics['textHeight'] + $topSpace + $i * $colorHeight + ($colorHeight - $fontHeight);
     if($x < $textExtentX) $x = $textExtentX;
     if($y < $textExtentY) $y = $textExtentY;
     $i++;
}

$canvas->cropimage($x + $rightMargin, $canvasHeight, 0, 0);

// Output the file
// TODO: we probably want to cache these images

header("Content-Type: image/png");
//header('Content-disposition: attachment; filename=transparency_image.png');
$canvas->setImageFormat('png');
echo $canvas;
file_put_contents('/tmp/test.png', $canvas);
