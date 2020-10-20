var Gks = [];
var GkTerms = [];
var Hks = [];
var L1 = null;
var L2 = null;
var C1 = null;
var C2 = null;
var A1 = null;
var A2 = null;
var INVA1TA1 = null;
var INVA2TA2 = null;
var A1Term = null;
var A2Term = null;
var w = 1000;

function registration(edges,vertices){
  var gk,hk,gkTerm = null;
  for (var i = 0; i < edges.length; i++) {
    gk = getGkMatrix(edges[i],vertices,true);
    Gks.push(gk);
    gkTerm = math.multiply(math.inv(math.multiply(math.transpose(gk),gk)),math.transpose(gk));
    GkTerms.push(gkTerm);
    hk = getHkFromEdge(edges[i],vertices,gkTerm);
    Hks.push(hk);
  }
  
  L1 = buildL1(Hks,edges);
  L2 = buildL2(edges);
}

function compilation(handles,vertices, barycentricMode ,_callback){
  C1 = buildC1(handles,vertices,barycentricMode);
  C2 = buildC2(handles,vertices,barycentricMode);
  
  A1 = math.concat(L1,C1,0);
  A2 = math.concat(L2,C2,0);
  
  A1 = new Matrix(A1.toArray());
  A2 = new Matrix(A2.toArray());
  A1Term = (A1.transpose().multiply(A1)).inverse().multiply(A1.transpose());
  A2Term = (A2.transpose().multiply(A2)).inverse().multiply(A2.transpose());
    
  _callback();
}

function buildC1(handles,vertices, barycentricMode){
  var C1 = math.zeros(handles.length*2,vertices.length*2);
  if(barycentricMode){
    for (var i = 0; i < handles.length; i++) {
      C1.set([2*i, 2*handles[i].triangleV1Index], w*(handles[i].l1));
      C1.set([2*i+1, 2*handles[i].triangleV1Index+1], w*(handles[i].l1));
      C1.set([2*i, 2*handles[i].triangleV2Index], w*(handles[i].l2));
      C1.set([2*i+1, 2*handles[i].triangleV2Index+1], w*(handles[i].l2));
      C1.set([2*i, 2*handles[i].triangleV3Index], w*(handles[i].l3));
      C1.set([2*i+1, 2*handles[i].triangleV3Index+1], w*(handles[i].l3));
    }    
  }else{
    for (var i = 0; i < handles.length; i++) {
      C1.set([2*i, 2*handles[i].v_index], w);
      C1.set([2*i+1, 2*handles[i].v_index+1], w);
    }
  }
  return C1;
}

function buildC2(handles,vertices,barycentricMode){
  var C2 = math.zeros(handles.length,vertices.length);
  if(barycentricMode){
    for (var i = 0; i < handles.length; i++) {
      C2.set([i,handles[i].triangleV1Index], w*(handles[i].l1));
      C2.set([i,handles[i].triangleV2Index], w*(handles[i].l2));
      C2.set([i,handles[i].triangleV3Index], w*(handles[i].l3));
    }    
  }else{
    for (var i = 0; i < handles.length; i++) {
      C2.set([i,handles[i].v_index], w);
    }
  }
  return C2;
}

function getHkFromEdge(edge,vertices,gkTerm){
  var edgeStartVertex = getVertex(edge.start,vertices);
  var edgeEndVertex = getVertex(edge.end,vertices);
  var ekx = edgeEndVertex.x - edgeStartVertex.x;
  var eky = edgeEndVertex.y - edgeStartVertex.y;
  var ekxyTerm = math.matrix([[ekx, eky],[eky, -ekx]]);
  var constantTerm = null;
  
  if(edge.isBorderEdge){
    constantTerm = math.matrix([[-1, 0, 1, 0, 0, 0],
                                [0, -1, 0, 1, 0, 0]]);
  }else{
    constantTerm = math.matrix([[-1, 0, 1, 0, 0, 0, 0, 0],
                                [0, -1, 0, 1, 0, 0, 0, 0]]);
  }
  
  let gkTermTopTwoRows = math.eval('gkTerm[1:2,:]', {
    gkTerm,
  });
  
  var h = math.subtract(constantTerm,math.multiply(ekxyTerm,gkTermTopTwoRows));
  return h;
}

function buildL1(Hks,edges){
  var L1 = math.matrix();
  for (var i = 0; i < Hks.length; i++) {
    for (var j = 0; j < Hks[i].size()[1]; j++) {
      L1.set([2*i, edges[i].HNeighbors.get([j,0]) ], Hks[i].get([0,j]))
      L1.set([2*i+1, edges[i].HNeighbors.get([j,0]) ], Hks[i].get([1,j]))
    }
  }
  return L1;
}

function buildL2(edges){
  var L2 = math.matrix();
  for (var i = 0; i < edges.length; i++) {
    L2.set([i,edges[i].end],1);
    L2.set([i,edges[i].start],-1);
  }
  return L2;  
}

function manipulation(handles,edges,origVertices){
  var b1 = buildB1(handles,edges);
  var similarityTransformResult = similarityTransform(b1);

  var b2x = buildB2(handles,edges,similarityTransformResult,origVertices,'x');
  var b2y = buildB2(handles,edges,similarityTransformResult,origVertices,'y');
  
  var scaleAdjustmentResult = scaleAdjustmentRenameMe(b2x,b2y);  
  
  return scaleAdjustmentResult;
}

function similarityTransform(b1){
  b1 = new Matrix(b1.toArray());
  var res = A1Term.multiply(b1);
  
  for (var i = 0; i < deformedVertices.length; i++) {
    deformedVertices[i].x = res.get(2*i,0);
    deformedVertices[i].y = res.get(2*i+1,0);
  }
  return deformedVertices;
}

function scaleAdjustmentRenameMe(b2x,b2y) {
  b2x = new Matrix(b2x.toArray());
  b2y = new Matrix(b2y.toArray());
  var resx = A2Term.multiply(b2x);
  var resy = A2Term.multiply(b2y);
  
  for (var i = 0; i < deformedVertices.length; i++) {
    deformedVertices[i].x = resx.get(i,0);
    deformedVertices[i].y = resy.get(i,0);
  }
  return deformedVertices;
}

function buildB1(handles,edges){
  var b1EdgeVectors = math.matrix(math.zeros([edges.length*2,1]));
  var b1Handles = math.matrix();
  var b1 = math.matrix();
  for (var i = 0; i < handles.length; i++) {
    b1Handles.set([2*i,0], w*handles[i].position.x);
    b1Handles.set([2*i+1,0], w*handles[i].position.y);
  }
  b1 = math.concat(b1EdgeVectors,b1Handles,0);
  
  return b1;
}

function buildB2(handles,edges,newVertices,origVertices,axis){
  var axis = (axis == 'x' ? 0 : 1);
  var b2EdgeVectors = math.matrix();
  var b2Handles = math.matrix();
  var b2 = math.matrix();
  var Tks = getTks(edges,Gks,newVertices);
  
  for (var i = 0; i < edges.length; i++) {
    var ek = getEdgeVectorFromEdge(edges[i],origVertices);
    b2EdgeVectors.set([i,0], math.multiply(Tks[i],ek).get([axis,0]));
  }
  
  for (var i = 0; i < handles.length; i++) {
    b2Handles.set([i,0], (axis == 0 ? w*handles[i].position.x : w*handles[i].position.y))
  }
  
  b2 = math.concat(b2EdgeVectors,b2Handles,0);
  
  return b2;
}

function getTks(edges,Gks,vertices){
  var Tks = [];
  for (var i = 0; i < edges.length; i++) {
    var edgeNeighbors = math.matrix();
    for (var k = 0; k < edges[i].neighbors.length; k++) {
      edgeNeighbors.set([2*k,0], getVertex(edges[i].neighbors[k],vertices).x);
      edgeNeighbors.set([2*k+1,0], getVertex(edges[i].neighbors[k],vertices).y);
    }
    
    var gkTerm = GkTerms[i];
    let gkTermTopTwoRows = math.eval('gkTerm[1:2,:]', {
      gkTerm,
    });
    
    var cksk = math.multiply(gkTermTopTwoRows,edgeNeighbors);
    var ck = cksk.get([0,0]);
    var sk = cksk.get([1,0]);
    var Tk = math.matrix([[ck,sk],[-sk,ck]]);
    var normalizationTerm = math.sqrt(math.add(math.square(ck),math.square(sk)));
    Tk = math.dotDivide(Tk,normalizationTerm);
    Tks.push(Tk);
  }
  return Tks;
}

function getGkMatrix(edge,vertices,includeTranslation){
  var vi,vj,vl,vr = null;
  var gk = null;
  if(includeTranslation){
    if(edge.isBorderEdge){
      vi = getVertex(edge.neighbors[0],vertices);
      vj = getVertex(edge.neighbors[1],vertices);
      vl = getVertex(edge.neighbors[2],vertices);
      gk = math.matrix([[vi.x, vi.y,  1, 0],
                        [vi.y, -vi.x, 0, 1],
                        [vj.x, vj.y,  1, 0],
                        [vj.y, -vj.x, 0, 1],
                        [vl.x, vl.y,  1, 0],
                        [vl.y, -vl.x, 0, 1]]);
    }else{
      vi = getVertex(edge.neighbors[0],vertices);
      vj = getVertex(edge.neighbors[1],vertices);
      vl = getVertex(edge.neighbors[2],vertices);
      vr = getVertex(edge.neighbors[3],vertices);
      gk = math.matrix([[vi.x, vi.y,  1, 0],
                        [vi.y, -vi.x, 0, 1],
                        [vj.x, vj.y,  1, 0],
                        [vj.y, -vj.x, 0, 1],
                        [vl.x, vl.y,  1, 0],
                        [vl.y, -vl.x, 0, 1],
                        [vr.x, vr.y,  1, 0],
                        [vr.y, -vr.x, 0, 1]]);
    }
  }else{
    if(edge.isBorderEdge){
      vi = getVertex(edge.neighbors[0],vertices);
      vj = getVertex(edge.neighbors[1],vertices);
      vl = getVertex(edge.neighbors[2],vertices);
      gk = math.matrix([[vi.x, vi.y],
                        [vi.y, -vi.x],
                        [vj.x, vj.y],
                        [vj.y, -vj.x],
                        [vl.x, vl.y],
                        [vl.y, -vl.x]]);
    }else{
      vi = getVertex(edge.neighbors[0],vertices);
      vj = getVertex(edge.neighbors[1],vertices);
      vl = getVertex(edge.neighbors[2],vertices);
      vr = getVertex(edge.neighbors[3],vertices);
      gk = math.matrix([[vi.x, vi.y],
                        [vi.y, -vi.x],
                        [vj.x, vj.y],
                        [vj.y, -vj.x],
                        [vl.x, vl.y],
                        [vl.y, -vl.x],
                        [vr.x, vr.y],
                        [vr.y, -vr.x]]);
    }
  }
  return gk;
}
