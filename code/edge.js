class Edge {
  constructor(start, end, parentFaceIndex) {
    this.start = start;
    this.end = end;
    this.parentFaceIndex = parentFaceIndex;
  }
  
  setNeighbors(neighbors){
    this.HNeighbors = math.matrix();
    this.neighbors = neighbors;
    for (var i = 0; i < neighbors.length; i++) {
      this.HNeighbors.set([2*i,0], 2*neighbors[i]);
      this.HNeighbors.set([2*i+1,0], 2*neighbors[i]+1);
    }
  }
  
  setIsBorderEdge(value){
    this.isBorderEdge = value;
  }
  
  equals(edge){
      var equal = false;
      if( ((this.start == edge.start) && (this.end == edge.end)) ||
          ((this.start == edge.end) && (this.end == edge.start)) ) {
              equal = true;
          }
      return equal;
  }
  
  static edgeDoesExist(edges,tmpEdge){
    var exists = false;
    for (var i = 0; i < edges.length; i++) {
      if(edges[i].equals(tmpEdge)){
        exists = true;
      }
    }
    return exists;
  }
  
  static getAllEdges(faces){
    var allEdges = [];
    
    for (var i = 0; i < faces.length; i++) {
      
      var currentEdge1 = new Edge(faces[i].a,faces[i].b,i);
      var currentEdge2 = new Edge(faces[i].b,faces[i].c,i);
      var currentEdge3 = new Edge(faces[i].a,faces[i].c,i);
      
      allEdges.push(currentEdge1);
      allEdges.push(currentEdge2);
      allEdges.push(currentEdge3);  
    }
    return allEdges;
  }
  
  static getEdgeNeighbors(edge,allEdges,faces){
    var count = 0;
    var neighbors = [];
    var face = null;
    neighbors.push(edge.start);
    neighbors.push(edge.end);
    for (var i = 0; i < allEdges.length; i++) {
      if(edge.equals(allEdges[i])){
        count++;
        face = faces[allEdges[i].parentFaceIndex]
        neighbors = addNeighbors(neighbors,allEdges[i],face);
        edge.this
      }
    }
    
    if(count == 2 || count == 1 ){ return neighbors }
    
    return neighbors;
  }
  
  static getBorderEdges(edges,faces){
    var borderEdges = [];
    for (var i = 0; i < edges.length; i++) {
      if(Edge.isBorderEdge(edges[i],faces)){
        borderEdges.push(edges[i]);
      }
    }
    return borderEdges;
  }
  
  static getNonBorderEdges(edges,faces){
    var nonBorderEdges = [];
    for (var i = 0; i < edges.length; i++) {
      if(!Edge.isBorderEdge(edges[i],faces)){
        nonBorderEdges.push(edges[i]);
      }
    }
    return nonBorderEdges;  
  }

}