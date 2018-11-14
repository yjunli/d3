function createV4SelectableForceDirectedGraph(svg, graph, parentWidth, parentHeight, id, title) {
    let d3v4 = d3;

    svg = d3v4.select(`svg.${`svg${id}`}`)
    .attr('width', parentWidth)
    .attr('height', parentHeight);

    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    let gMain = svg.append('g')
    .classed('g-main', true);

    let rect = gMain.append('rect')
    .attr('width', parentWidth)
    .attr('height', parentHeight)
    .style('fill', 'white')
    .attr("transform",'translate(0, 100)')

    let gDraw = gMain.append('g').attr("transform",'translate(0, 100)');

    // 缩放
    let zoom = d3v4.zoom()
    .on('zoom', zoomed)

    gMain.call(zoom);
    // 取消节点双击默认的放大事件
    gDraw.call(d3v4.zoom()).on('dblclick', null);

    function zoomed() {
        gDraw.attr("transform", d3v4.event.transform);
    }

    let color = d3v4.scaleOrdinal(d3v4.schemeCategory20);

    if (! ("links" in graph)) {
        // Graph is missing links
        return;
    }

    let nodes = {};
    let i;
    for (i = 0; i < graph.nodes.length; i++) {
        nodes[graph.nodes[i].id] = graph.nodes[i];
        graph.nodes[i].weight = 1.01;
    }

    // the brush needs to go before the nodes so that it doesn't
    // get called when the mouse is over a node
    let gBrushHolder = gDraw.append('g');
    let gBrush = null;

    let link = gDraw.append("g")
        .attr("class", "linkGroup")
        .selectAll(".linkGroup")
        .append("g")
        .data(graph.links)
        .enter().append("g")
        .attr("class", "link");
        
    let path = link.append("path")
        .style("stroke",function(d){//  设置线的颜色  
            return color(d.name);  
        });

    let nodeGroup = gDraw.append("g")
        .attr("class", "nodeGroup")
        .selectAll(".nodeGroup")
        .append("g")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node");
    
    nodeGroup.append("circle")
        .attr("r", 25 + 1) // 改变圆圈大小
        .attr("fill", function(d) { // 改变点被填充的颜色
            return color(d.labels[0]); 
        })
        .style("opacity", 0.5);
        
    nodeGroup.append("circle")
        .attr("r", 25) // 改变圆圈大小
        .attr("fill", function(d) { // 改变点被填充的颜色
            return color(d.labels[0]); 
        })

    nodeGroup.call(d3v4.drag() // 拖拽事件
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", draggended));


    // 节点内文字
    nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", '#fff') 
        .attr("dy", 4)
        .text(function(d) {
            if (d.name.length > 5) {
                let num = (25*2)/10 - 2;
                return d.name.substr(0, num) + '...'; 
            } else {
                return d.name
            }
        })
        .style("font-size", "10px");

    // 鼠标悬浮显示的文字
    nodeGroup.append("title")
        .attr("color", "#000")
        .text(function(d) { 
            return d.name;
        });
    
    // 不绑定到与node相同的节点上，取消其滚动事件
    let nodeLegend = gMain.append("g") // 画legend
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("transform", function () {
            if (parentWidth > 0) {
                return `translate(-${parentWidth - 100}, 0)`
            } else {
                return `translate(0, 0)`
            }
        })
          .attr("text-anchor", "end")
          .selectAll("g")
          .data(graph.nodeLegend)
          .enter().append("g")
          .attr("transform", function(d, i) { return `translate(${i * 100}, 0)`; });

    nodeLegend.append("text")
        .attr("x", parentWidth - 20)
        .attr("y", 12)
        .attr("dy", "0.1em")
        .text(function(d) { return d; });

    nodeLegend.append("rect")
        .attr("x", parentWidth - 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("ry", 3)
        .attr("rx", 3)
        .attr("fill", function(d){
                let str = d.slice(0, d.lastIndexOf('('));
                return color(str); 
        })
        .style('border-radius', '5px');

    nodeLegend.on('mouseover', function(d) {
        let str = d.slice(0, d.lastIndexOf('('));
        nodeGroup.style("opacity",function(edge){
            if(edge.labels[0] === str){
                return 1;
            }else{
                return 0.2;
            }
        })
        link.style("opacity", 0.2)
    })
    .on("mouseout",function(d,i){
        nodeGroup.style("opacity",1);
        link.style("opacity", 1)
    })
    
    
    // 不绑定到与node相同的节点上，取消其滚动事件
    let linkLegend = gMain.append("g") // 画legend
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", function () {
            if (parentWidth > 0) {
                return `translate(-${parentWidth - 100}, 35)`
            } else {
                return `translate(0, 35)`
            }
        })
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(graph.linkLegend)
        .enter().append("g")
        .attr("transform", function(d, i) { return `translate(${i * 100}, 0)`; });

    linkLegend.append("text")
        .attr("x", parentWidth - 20)
        .attr("y", 12)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });

    linkLegend.append("rect")
        .attr("x", parentWidth - 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", function(d){
            let str = d.slice(0, d.lastIndexOf('('));
            return color(str); 
        });

    let simulation = d3v4.forceSimulation(nodeGroup)
    .force("link", d3v4.forceLink(link)
            .id(function(d) { return d.id; })
            .distance(function(d) { 
                return 150; // 设置节点之间会引力距离
            })
          )
    .force("charge", d3v4.forceManyBody()) // forceManyBody - 创建多体力
    .force("center", d3v4.forceCenter(parentWidth / 2, parentHeight / 2)) // .forceCenter 创建一个力中心。
    .force("x", d3v4.forceX()) // forceX - 创建x-定位力 parentWidth/2
    .force("y", d3v4.forceY(parentHeight/2))
    .force('collide', d3.forceCollide().radius(() => 38)); // collide 为节点指定一个radius区域来防止节点重叠。

    simulation.nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    // ticked函数的作用：由于力导向图是不断运动的，每一时刻都在发生更新，因此，必须不断更新节点和连线的位置。 
    // 力导向图布局 force 有一个事件 tick，每进行到一个时刻，都要调用它，更新的内容就写在它的监听器里就好。
    function ticked() {
        path.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .attr("d",function(d){
                // d是路径描述，M是Moveto，移动到，C是Curveto，表示贝塞尔曲线
                // M = moveto(M X,Y) ：将画笔移动到指定的坐标位置
                // L = lineto(L X,Y) ：画直线到指定的坐标位置
                // Z = closepath()：关闭路径
                return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`
            });

        nodeGroup.attr('transform', function(d) {
            return `translate(${d.x}, ${d.y})`
        });
    }

    let brushMode = false;
    let brushing = false;

    let brush = d3v4.brush()
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    function brushstarted() {
        // keep track of whether we're actively brushing so that we
        // don't remove the brush on keyup in the middle of a selection
        brushing = true;

        node.each(function(d) { 
            d.previouslySelected = shiftKey && d.selected; 
        });
    }

    rect.on('click', () => {
        nodeGroup.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        nodeGroup.classed("selected", false);
    });

    function brushed() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;
        let extent = d3v4.event.selection;
        node.classed("selected", function(d) {
            return d.selected = d.previouslySelected ^
            (extent[0][0] <= d.x && d.x < extent[1][0]
             && extent[0][1] <= d.y && d.y < extent[1][1]);
        });
    }

    function brushended() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;
        if (!gBrush) return;

        gBrush.call(brush.move, null);

        if (!brushMode) {
            // the shift key has been release before we ended our brushing
            gBrush.remove();
            gBrush = null;
        }

        brushing = false;
    }

    d3v4.select('body').on('keydown', keydown);
    d3v4.select('body').on('keyup', keyup);

    let shiftKey;

    function keydown() {
        shiftKey = d3v4.event.shiftKey;

        if (shiftKey) {
            // if we already have a brush, don't do anything
            if (gBrush)
                return;

            brushMode = true;

            if (!gBrush) {
                gBrush = gBrushHolder.append('g');
                gBrush.call(brush);
            }
        }
    }

    function keyup() {
        shiftKey = false;
        brushMode = false;

        if (!gBrush)
            return;

        if (!brushing) {
            // only remove the brush if we're not actively brushing
            // otherwise it'll be removed when the brushing ends
            gBrush.remove();
            gBrush = null;
        }
    }

    function dragstarted(d) {
        // 设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
        if (!d3v4.event.active) simulation.alphaTarget(1).restart();
        // 使得这个drag事件不会上升到父级，这样避免了当拉拽网络节点时也拽动整个图形
        d3v4.event.sourceEvent.stopPropagation();
        if (!d.selected && !shiftKey) {
            // if this node isn't selected, then we have to unselect every other node
            nodeGroup.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
        }

        d3v4.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

        nodeGroup.filter(function(d) { return d.selected; })
        .each(function(d) {
          d.fx = d.x;
          d.fy = d.y;
        })

    }

    function dragged(d) {
        nodeGroup.filter(function(d) { return d.selected; })
            .each(function(d) { 
                d.fx += d3v4.event.dx;
                d.fy += d3v4.event.dy;
            })
    }

    function draggended () {

        // alpha是动画的冷却系数，运动过程中会不断减小，直到小于0.005为止，此时动画会停止。
        if(simulation.alpha() <= 1){  // 足够稳定时，才渲染一次
            simulation.stop(); // 渲染完成后立即停止刷新
        }
    }
    let texts = ['Use the scroll wheel to zoom',
                 'Hold the shift key to select nodes']

    svg.selectAll('text')
        .data(texts)
        .enter()
        .append('text')
        .attr('x', 900)
        .attr('y', function(d,i) { return 470 + i * 18; })
        .text(function(d) { return d; });

   	//添加标题
	if(title!="") {
		svg.append("g")
		.append("text")
		.text(title)
		.attr("class","name")
		.attr("x",30)
		.attr("y",30)
        .style("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("fill", '#000') ;
	}

    return svg;
};