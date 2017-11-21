"use strict";

var testDimension = {width: 600, height: 600, cx: 300, cy: 300};

var ALLOWED_PAUSE = 2000;

var testObject = {
	targetCircle: {x: 0, y: 0, r: 10},
	startCircle: {x: 0, y: 0, t: 0},
	lastClicked: {},
	circlePositions: [],
	currentTargetPosition: 0,
	targetsClicked: 0,
	circleParameters: {num: 19, distance: 500, width: 50},
	isActive: false,
	data: [],
        
        initializeDataSet: function() {
            
                var div = d3.select('#dataSetContainer').append('div').attr('id', 'dataSet').text('Data Set').style('background-color', '#486685');

		div.append('button').attr('id', 'ClearDataSet').attr('type', 'button').text('Clear');

                div.append('button').attr('id', 'DownloadDataSet').attr('type', 'button').text('Download');
                
                $('#ClearDataSet').click(function() {
			location.reload();
		});
                
                $('#DownloadDataSet').click(function() {
                    var csvContent = '"Time","Distance","Width"\n';
                    $.each(testObject.data,function(i, datapoint){
                        csvContent += '"'+datapoint.time+'","'+datapoint.distance+'","'+datapoint.width+'"\n';
                    });
                    window.open("data:text/csv;charset=UTF-8,"+encodeURIComponent(csvContent));  
		});

	},
        
        generateCirclePositions: function(num, d, w) {

		this.circlePositions = [];

		for (var i = 0; i < num; i++) {
			this.circlePositions[i] = {x: testDimension.cx + ((d/2) * Math.cos((2 * Math.PI * i) / num)),
				y: testDimension.cy + ((d/2) * Math.sin((2 * Math.PI * i) / num)), w: w};
		}
	},
        
        updateCirclePositions: function() {
		this.targetsClicked = 0;

		this.generateCirclePositions(this.circleParameters.num,this.circleParameters.distance,this.circleParameters.width);

		var circles = testAreaContainer.selectAll('circle').data(this.circlePositions);

		var insert = function(d) {
			d.attr('cx', function(d) { return d.x; }).attr('cy', function(d) { return d.y; }).attr('r', function(d) { return d.w / 2; });
		}

		circles.enter().append('circle').attr('class', 'inactive').call(insert);

		circles.transition().call(insert);

		circles.exit().transition().attr('r', 0).remove();

		this.currentTargetPosition = 0;
		this.generateTargetCircle();
		this.isActive = false;
            },
            
	generateTargetCircle: function() {
		this.targetCircle = this.circlePositions[this.currentTargetPosition];
		this.targetCircle.distance = this.circleParameters.distance;
		this.currentTargetPosition = (this.currentTargetPosition + Math.floor(this.circlePositions.length/2)) % this.circlePositions.length;

		var target = testAreaContainer.selectAll('#target').data([this.targetCircle]);

		var insert = function(d) {  d.attr('cx', function(d) { return d.x; }).attr('cy', function(d) { return d.y; })
                            .attr('r', function(d) { return d.w / 2; }).style("fill-opacity", .5).style("stroke", "green")
                            .style("stroke-width", 2).style("fill", "green");
		}

		target.enter().append('circle').attr('id', 'target').call(insert);

		target.transition().call(insert);
                
		this.isActive = true;
	},

	mouseClickListener: function(x, y) {

		if (findDistance({x: x, y: y}, this.targetCircle) < (this.targetCircle.w / 2)) {
			this.pushDataPoint({startCircle: this.startCircle, targetCircle: this.targetCircle, hit: {x: x, y: y, t: (new Date).getTime()}});
			this.removeTarget();

			if (this.targetsClicked >= this.circlePositions.length) {
                                d3.select('body').append('div').attr('class', 'msg').text('Please change distance/width.');
                                d3.select('.msg').append('button').attr('id', 'OK').attr('type', 'button').text('OK').style('margin-left','20px');
                                $('#OK').click(function() {
                                        d3.select('.msg').remove();
                                });
				this.targetsClicked = 0;
				this.currentTargetPosition = 0;
				this.updateCirclePositions;
				this.generateTargetCircle();
				this.isActive = false;
			}
			else {
				this.targetsClicked++;
				this.generateTargetCircle();
			}

			this.lastClicked = {x: x, y: y, t: (new Date).getTime()};
			this.startCircle = this.lastClicked;
		}
	},

	pushDataPoint: function(data) {
            
		if (this.isActive == false)
			return;

		var dt = data.hit.t - data.startCircle.t;

		if (dt < ALLOWED_PAUSE)
		{
			var dist = findDistance(data.targetCircle, data.startCircle);
                        
                        this.data.push({time: dt, distance: data.targetCircle.distance, width: data.targetCircle.w, hit: data.hit,
				startCircle: data.startCircle, targetCircle: data.targetCircle});
		}
	},
        
	removeTarget: function() {
		testAreaContainer.selectAll('#target').data([]).exit().remove();
		this.isActive = false;
	},

	
};

function onMouseClicked(){
	var m = d3.svg.mouse(this);
	testObject.mouseClickListener(m[0], m[1]);
}

function findDistance(p1, p2) {
	var dx = p1.x - p2.x;
	var dy = p1.y - p2.y;
	return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function drawRectangle(elem, dimensions) {
	return elem.append('rect').attr('cx', 0).attr('cy', 0).attr('rx', 20).attr('ry', 20).attr('width', dimensions.width)
                .attr('height', dimensions.height).attr('class', 'back').style('fill', '#f3f3f3');
}


var testAreaContainer = d3.select('#test-container').append('svg').attr('width', testDimension.width).attr('height', testDimension.height)
        .style('pointer-events', 'all').on('mousedown', onMouseClicked).call(drawRectangle, testDimension);

testObject.isActive = false;
testObject.initializeDataSet();

$('input:radio[name=radioWidth]')[0].checked = true;
$('input:radio[name=radioWidth]')[0].click('changeWidth(this)');
$('input:radio[name=radioDistance]')[0].checked = true;
$('input:radio[name=radioDistance]')[0].click('changeDistance(this)');

function changeDistance(elem){
    testObject.circleParameters.distance = elem.value;
    testObject.updateCirclePositions();
    d3.select('#distanceValue').text(elem.value);
}

function changeWidth(elem){
    testObject.circleParameters.width = elem.value;
    testObject.updateCirclePositions();
    d3.select('#widthValue').text(elem.value);
}
