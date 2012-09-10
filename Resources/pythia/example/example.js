$.domReady(function () {
    var container = $("#container");

    s =
    pythia()
        .size([400, 400])
        .barChart()
            .data(data)
            .on('rect', 'click', function () {})
            .on('rect', 'mouseover', function () { this.pushT(); this.scale(1.2); })
            .on('rect', 'mouseout', function () { this.popT(); })
        .end()
        .size([400, 400])
        .barChart({multiline: true, stacked:true})
            .data(dataMultiLine)
        .end()
        .size([400, 400])
    ;
});

var data          = [ 40, 50, 30, 20, 80, 60 ];
var dataMultiLine = [[ 40, 50, 30, 20, 80, 60 ]
                    ,[ 40, 80, 30, 20, 80, 20 ]
                    ,[ 40, 50, 30, 20, 30, 60 ]
                    ];
var sankeyData = {
      'a': { value: 250, out: {b:100, c:100, d:50} }
    , 'a1':{ value: 95, out: {b:10, c:10, d:30, g: 45} }
    , 'b': { value: 110, out: {e:80} }
    , 'c': { value: 110, out: {e:70, f:40} }
    , 'd': { value: 80, out: {e:70} }
    , 'e': { value: 220 }
    , 'f': { value: 40 }
    , 'g': { value: 40 }
}


