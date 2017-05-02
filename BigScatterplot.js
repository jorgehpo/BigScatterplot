function BigScatterplot(parentId, data, xAccessor, yAccessor, cAccessor, cmap, onHover, onSelect, viewport={width:500, height:500}, 
            radius=1){
    this.brushed = this.brushed.bind(this);
    this.mousemove = this.mousemove.bind(this);


    this.viewport = viewport;

    this.radius = radius
    this.div = d3.select(parentId).append("div");
    this.div.style("position","relative");
    
    this.canvas = this.div.append("canvas");
    this.canvas.attr("width", viewport.width).attr("height", viewport.height);
    this.canvas.style("position", "absolute").style("left","0px").style("top","0px");
    
    this.svg = this.div.append("svg");
    this.svg.attr("width", viewport.width).attr("height", viewport.height);
    this.svg.style("position", "absolute").style("left","0px").style("top","0px");

    this.svg.on("mousemove", this.mousemove);

    this.data = data;
    this.xAccessor = xAccessor;
    this.yAccessor = yAccessor;
    this.cAccessor = cAccessor;
    this.cmap = cmap;
    this.onHover = onHover;
    this.onSelect = onSelect;
    this.preprocess();
    this.draw();
}

BigScatterplot.prototype.mousemove = function(){
    let mouse = d3.mouse(this.svg.node());
    let node = this.quadtree.find(this.xScale.invert(mouse[0]), this.yScale.invert(mouse[1]), 1);
    if (node){
        this.onHover(node)
    }else{
        this.onHover()
    }
}

BigScatterplot.prototype.preprocess = function(){
    let halfRadius = this.radius/2;
    this.xScale = d3.scaleLinear()
        .domain(d3.extent(this.data, (d)=>this.xAccessor(d)))
        .range([halfRadius, this.viewport.width - halfRadius]);

    this.yScale = d3.scaleLinear()
        .domain(d3.extent(this.data, (d)=>this.yAccessor(d)))
        .range([halfRadius, this.viewport.height - halfRadius]);

    let xAccessor = this.xAccessor;
    let yAccessor = this.yAccessor;

    this.quadtree = d3.quadtree()
        .extent([this.xScale.domain(), this.yScale.domain()])
        .x(function(d) {return xAccessor(d)})
        .y(function(d) {return yAccessor(d)})
        .addAll(this.data);


    this.brush = d3.brush()
        .on("brush", this.brushed);

    this.svg.call(this.brush)
}


BigScatterplot.prototype.brushed = function (){
    let evt = d3.event.selection;
    let e = [[0,0], [0,0]];
    e[0][0] = this.xScale.invert(evt[0][0]);
    e[1][0] = this.xScale.invert(evt[1][0]);
    e[0][1] = this.yScale.invert(evt[0][1]);
    e[1][1] = this.yScale.invert(evt[1][1]);
    //console.log(JSON.stringify(e))
    let selected = [];

    this.quadtree.visit(function(node,x1,y1,x2,y2) {
        if (!node.length) {
            do {
                if (node.data.x >= e[0][0] && node.data.x <= e[1][0] && node.data.y >= e[0][1] && node.data.y <= e[1][1]) {
                    selected.push(node.data)
                }
            } while (node = node.next)
        }
        return x1 > e[1][0] || y1 > e[1][1] || x2 < e[0][0] || y2 < e[0][1];
    });
    console.log(selected)
}


BigScatterplot.prototype.draw = function (){
    let ctx = this.canvas.node().getContext("2d");
    
    for (let i = 0; i < this.data.length; ++i){
        ctx.fillStyle = this.cmap(this.cAccessor(this.data[i]));
        ctx.beginPath();
        ctx.arc(this.xScale(this.xAccessor(this.data[i])), 
            this.yScale(this.yAccessor(this.data[i])), 
            this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}