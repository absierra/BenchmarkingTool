<?php
    $response = array (
        'sources'    => array(),
        'nodes'      => array(),
        'nodeSource' => array(),
        'hierarchy'  => array(),
        'lines'      => array(),
        'links'      => array()
    );
    gc_enable();

    $filename = './Cache/budget/lines';

    if (false || !file_exists($filename)) {
        dropValues($response);

        $notes = file_get_contents('Data/notes.json');
        $response['notes'] = json_decode($notes);

        $data  = json_encode($response);

        file_put_contents($filename, $data);
    } else {
        $data = file_get_contents($filename, $data);
        $temp = (array)json_decode($data);
        $notes = file_get_contents('Data/paloalto_annotations.json');
        $temp['notes'] = json_decode($notes);
        $data = json_encode($temp);
    }

    $renderer->assign('budget', json_encode($data));
//    $renderer->assign('rawNodes', json_encode($data->nodes));
//    $renderer->assign('rawLinks', json_encode($data->links));


    function dropValues(&$response) {
        //Load the hierarchy config file
        $data = file_get_contents('Data/paloalto_hieararchy.json');
        $hierarchy = json_decode($data);

        //Initialize the top level heirarchies
        $values = array();
        foreach ($hierarchy->order as $drop) {
            $values[$drop] = array();
        }

        //Query *all* line item data
        $db = Data::$registry['pa_budget_data'];//TODO fix this key

        $budget       = $db->budget;
        $total        = $budget->count();
        $budget_lines = $budget->find();

        $total         += $db->employees->count();
        $employee_lines = $db->employees->find();

        process_data($response, $employee_lines, $hierarchy->hierarchy, array('fte', 'salary'));
        process_data($response, $budget_lines, $hierarchy->hierarchy, array('amount'));
    }

    function process_data(&$response, &$lines, &$hierarchy, $aggregate) {
        //Fill in all drop down values
        $line_count = 0;
        foreach ($lines as $line) {
            $used = array();
            $treeCount = 0;

            foreach ($hierarchy as $dropdown => $children) {
                $used[$treeCount] = array();
                traverse($response, $children, $response['hierarchy'][$dropdown], $line, $used[$treeCount]);
                $treeCount++;
            }

            $line_count++;

            //cross all the used values with each other to generate link and 
            //higher level line information
            $nodeCount = count($used[0]);
            foreach ($used[0] as $key) {
                $link = array($key);
                cross(
                    $response['lines']
                  , $response['links']
                  , $used
                  , $line
                  , $aggregate
                  , 1
                  , $link);
            }
        }
    }

    function cross(&$lines, &$links, &$used, &$line, &$aggregate, $tree, &$link) {
        static $reverseLine = array();

        $treeCount   = count($used);
        $nodeCount = count($used[$tree]);

        for ($n = 0; $n < $nodeCount; ++$n) {
            $linkKey = $used[$tree][$n];

            $link[] = $linkKey;

            if ($tree < $treeCount - 1) {
                cross($lines, $links, $used, $line, $aggregate, $tree + 1, $link);
                array_pop($link);
            } else {
                $year = $line['year'];

                $reverseKey = implode($link,'|');
                if (!isset($reverseLine[$reverseKey])) {
                    $key = nextLineKey();
                    $reverseLine[$reverseKey] = $key;
                    $lines[$key] = array();
                } else {
                    $key = $reverseLine[$reverseKey];
                }

                if (!isset($lines[$key][$year])) {
                    $lines[$key][$year] = array();
                }

                foreach ($aggregate as $a) {
                    if (!isset($lines[$key][$year][$a])) {
                        $lines[$key][$year][$a] = $line[$a];
                    } else {
                        $lines[$key][$year][$a] += $line[$a];
                    }
                }

                $linkCount = count($link);

                $recur = function (&$list, $depth) use(&$linked, &$link, &$recur, $linkCount, &$key) {
                    foreach ($link as $l) {
                        if (!isset($linked[$l])) {
                            if (!isset($list[$l])) {
                                $list[$l] = array();
                            }
                            if ($depth == $linkCount - 1) {
                                $list[$l] = $key;
                                return;
                            }
                            $linked[$l] = 1;
                            $recur($list[$l], $depth + 1);
                            unset($linked[$l]);
                        }
                    }
                };

                $recur($links, 0, array());
            }
        }
    }


    //Recursively trace through the dropdown level hierarchy and fill in values
    //from line items
    function traverse(&$response, &$level, &$values, &$line, &$used, $uncheck, &$lastkey, &$aggregate) {
        static $reverseSource, $reverseValues = array();


        foreach($level as $source => $attributes) {

            if (is_array($attributes)) {
                $attr = $attributes[0];
                $children = $attributes[1];
            } else {
                $attr = new stdClass();
                $children = $attributes;
            }

            if ($attr->constant) {
                $v = $source;
            } else if ($attr->accessor) {
                $v = $source($line);

                if ($v === false) {
                    continue;
                }
            } else {
                $v = $line[$source];

                if ($v == '') {
                    continue;
                }
            }

            if ($attr->filter) {
                if ($attr->filter->$v) {
                    continue;
                }
            }

            if (!isset($reverseSource[$source])) {
                $sourceKey = nextSourceKey();
                $reverseSource[$source]    = $sourceKey;
                $reverseValues[$sourceKey] = array();
                $response['sources'][$sourceKey] = $source;
            } else {
                $sourceKey = $reverseSource[$source];
            }

            //TODO this is fragile
            $reverseKey = $v.':'.$lastkey;

            if (!isset($reverseValues[$sourceKey][$reverseKey])) {
                $key = nextValKey();
                $reverseValues[$sourceKey][$reverseKey] = $key;
                $response['nodes'][$key] = $v;

                $values[$key] = array(
                    'ch' => array(),
                );


                if ($attr->special && is_string($attr->special)) {
                    $values[$key]['id'] = $attr->special;
                } else if ($attr->special && $attr->special->$v) {
                    $values[$key]['id'] = $attr->special->$v;
                }

                if ($attr->fixed && is_string($attr->fixed)) {
                    $values[$key]['fixed'] = 1;
                } else if ($attr->fixed && is_int($attr->fixed)) {
                    $values[$key]['fixed'] = 1;
                } else if ($attr->fixed && $attr->fixed->$v) {
                    $values[$key]['fixed'] = 1;
                }

                if ($attr->nocheckbox) {
                    $values[$key]['nocheckbox'] = 1;
                }
                if ($attr->noaggregate) {
                    $values[$key]['noaggregate'] = 1;
                }
                if ($attr->noexpand) {
                    $values[$key]['noexpand'] = 1;
                }
                if ($attr->hidden) {
                    $values[$key]['hidden'] = 1;
                }

                if ($attr->order) {
                    $index = array_search($v, $attr->order);
                    if ($index !== false) {
                        $values[$key]['order'] = $index + 1;
                    }
                }

                $response['nodeSource'][$key] = $sourceKey;
            } else {
                $key = $reverseValues[$sourceKey][$reverseKey];
            }

            if ($uncheck || $attr->uncheck) {
                $uncheck = $values[$key]['uncheck'] = 1;
            }

            $use = true;
            $resetagg = false;
            if ($attr->aggregate) {
                $resetagg = true;
                $oldaggregate = $aggregate;
                $aggregate = $attr->aggregate;
            }
            if (isset($aggregate)) {
                if (!isset($line[$aggregate])) {
                    $use = false;
                }
            }


            traverse(&$response, $children, $values[$key]['ch'], $line, &$used, $uncheck, $key, $aggregate);

            if (!count($values[$key]['ch'])) {
                unset($values[$key]['ch']);
                //This is a leaf node
                if (!$values[$key]['nocheckbox'] && !$values[$key]['noaggregate'] && $use)
                    $used[] = $key;
            }
            if ($resetagg)
                $aggregate = $oldaggregate;
        }
    }

    function nextSourceKey() {
        static $key = 0;
        return ++$key; //starting with one makes false tests easier
    }

    function nextValKey() {
        static $key = 0;
        return strKey($key++);
    }

    function nextLineKey() {
        static $key = 0;
        return strKey($key++);
    }

    function strKey($numeric) {
        //Characters need to be valid at the end of a DOM class name
        $keyChars =
          '_123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $offset = strlen($keyChars);

        $key = '';

        if ($numeric == 0) {
            $key = $keyChars[0];
        }

        while ($numeric != 0) {
            $digit   = $numeric % $offset;
            $numeric = floor(($numeric - $digit) / $offset);
            $key    .= $keyChars[$digit];
        }

        return $key;
    }
?>
