<?php

class CRM_Simplemail_BAO_TwoColumn {
	private	$maxLineLength = 50;	// characters
	private $maxLines = 16;
	
	public function isTwoColumn($text){
		
		$lineCount = substr_count( strtolower($text), "<br" );
		$text = strip_tags($text);
		
		$characterCount = strlen($text);
		$lineCount += ceil( $characterCount / $this->maxLineLength );
		
		error_log('Debug TwoColumn. Line count');
		error_log($lineCount);
		
		return ($lineCount > $this->maxLines);
		
	}
	
	public function getColumns($text){
		$colA = '';
		$colB = '';
		
		$text = preg_replace('|<br[^>]*>|i', "\n", $text);

		$text = static::textWrap($text, $this->maxLineLength);
		
		$lines = explode("\n", $text);
		$halfLines = ceil(count($lines) / 2);
		
		$colA = implode("\n", array_slice($lines, 0, $halfLines));
		$colB = implode("\n", array_slice($lines, $halfLines));
		
		$colA = str_replace("\n\n", "\n", $colA);
		$colB = str_replace("\n\n", "\n", $colB);
		
		// we append a new line to column A as the user will never see it, unless they "go responsive"
		// then this new line will add a spacer between column A and B
		if ($colA[ strlen($colA) -1] != "\n"){
			$colA.="\n";
		}
		
		// The right hand column should never start with a line break as it puts the tops of the columns out of line
		if ($colB[0] == "\n"){
			$colB[0] = "";
		}

		$colA = str_replace("\n", "<br/>", $colA);
		$colB = str_replace("\n", "<br/>", $colB);
		
		return array($colA, $colB);
	}


	// Taken from: http://php.net/manual/en/function.wordwrap.php#59257
  public static function textWrap($text, $length) { 
    $new_text = ''; 
    $text_1 = explode('>',$text); 
    $sizeof = sizeof($text_1); 
    for ($i=0; $i<$sizeof; ++$i) { 
        $text_2 = explode('<',$text_1[$i]); 
        if (!empty($text_2[0])) { 
            $new_text .= preg_replace('#([^\n\r .]{'.(int) $length.'})#i', '\\1  ', $text_2[0]); 
        } 
        if (!empty($text_2[1])) { 
            $new_text .= '<' . $text_2[1] . '>';    
        } 
    } 
    return $new_text; 
	} 
	
}

?>