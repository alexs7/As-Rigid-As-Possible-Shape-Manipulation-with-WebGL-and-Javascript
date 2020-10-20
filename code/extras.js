function renderAxes(){
  var colors = ['red','green','blue'];
  for (var i = 0; i < 3; i++) {
    var geometry = new THREE.Geometry();
    var axis_color = colors[i];
    switch (i) {
      case 0:
        geometry.vertices.push(new THREE.Vector3(-5, 0, 0));
        geometry.vertices.push(new THREE.Vector3(5, 0, 0));
        break;
      case 1:
        geometry.vertices.push(new THREE.Vector3(0, -5, 0));
        geometry.vertices.push(new THREE.Vector3(0, 5, 0));
        break;
      case 2:
        geometry.vertices.push(new THREE.Vector3(0, 0, 5));
        geometry.vertices.push(new THREE.Vector3(0, 0, -5));
        break;
    };
    var material = new THREE.LineBasicMaterial({ color: axis_color }); 
    var axis =  new THREE.Line(geometry, material);
    scene.add(axis);
  };
};

function addNeighbors(neighbors,edge,face){
  var face =  faces[edge.parentFaceIndex];
  var vertex1 = face.a;
  var vertex2 = face.b;
  var vertex3 = face.c;
  
  if(!neighbors.includes(vertex1)){ neighbors.push(vertex1) };
  if(!neighbors.includes(vertex2)){ neighbors.push(vertex2) };
  if(!neighbors.includes(vertex3)){ neighbors.push(vertex3) };
  
  return neighbors;
}

function drawEdge(edge,model){
  drawMarker(createMarker(model.geometry.vertices[edge.start],edge.start));
  drawMarker(createMarker(model.geometry.vertices[edge.end],edge.end));
}

function getVertex(i,vertices){
  return vertices[i];
}

function getEdgeVectorFromEdge(edge,vertices){
  var edgeVector = math.matrix();
  var edgeEndVertex = getVertex(edge.end,vertices);
  var edgeStartVertex = getVertex(edge.start,vertices);
  
  edgeVector.set([0,0], edgeEndVertex.x - edgeStartVertex.x );
  edgeVector.set([1,0], edgeEndVertex.y - edgeStartVertex.y );
  
  return edgeVector;
}

function isBorderEdge(edge,faces){
  var isBorderEdge = null;
  var count = 0;
  
  for (var i = 0; i < faces.length; i++) {
    var edge1 = new Edge(faces[i].a,faces[i].b,i);
    var edge2 = new Edge(faces[i].b,faces[i].c,i);
    var edge3 = new Edge(faces[i].a,faces[i].c,i);
    if(edge.equals(edge1) || edge.equals(edge2) || edge.equals(edge3)){
      count ++;
    }
  }
  
  if(count < 2){
    isBorderEdge = true;
  }else{
    isBorderEdge = false;
  }
  return isBorderEdge;
}

function cloneVertices(vertices){
  var clonedVertices = [];
  for (var i = 0; i < vertices.length; i++) {
    clonedVertices.push(vertices[i].clone());
  }
  return clonedVertices;
}

function cloneHandles(handles){
  var clonedHandles = [];
  for (var i = 0; i < handles.length; i++) {
    clonedHandles.push(handles[i].clone());
  }
  return clonedHandles;
}

function getNeighborVerticesCoordinates(neighbors,vertices){
  var vertexCoordinates = math.matrix();
  var vertex = null;
  for (var k = 0; k < neighbors.length; k++) {
    vertex = getVertex(neighbors[k],vertices);
    vertexCoordinates.set([2*k,0],vertex.x);
    vertexCoordinates.set([2*k+1,0],vertex.y);
  }
  return vertexCoordinates;
}

function createTrianglesFromFaces(faces, vertices){
  var triangles = [];
  var v1,v2,v3;
  for (var i = 0; i < faces.length; i++) {
    v1 = getVertex(faces[i].a,vertices);
    v2 = getVertex(faces[i].b,vertices);
    v3 = getVertex(faces[i].c,vertices);
    
    var triangle = new THREE.Triangle(v1,v2,v3);
    triangle.v1Index = faces[i].a;
    triangle.v2Index = faces[i].b;
    triangle.v3Index = faces[i].c;
    triangles.push(triangle);
  }
  
  return triangles;
}

// This is legacy code
function pseudoInverse(matrix){
  var pseudoInverse = math.matrix();
  var res = numeric.svd(matrix.toArray());
  var U = math.matrix(res.U);
  var S = math.matrix(res.S);
  var V = math.matrix(res.V);
  var tol = 5.3291e-15;
  for (var i = 0; i < S.size()[0]; i++) {
    if(S.get([i]) > tol){
      S.set([i],1/S.get([i]));
    }
  }
  S = math.diag(S);
  pseudoInverse = math.multiply(math.multiply(V,S),math.transpose(U));
  return pseudoInverse;
}