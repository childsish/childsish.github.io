var visited = new Set()
var to_visit = []

for (var i = 1; i < 100; i++) {
   to_visit.push(i)
}

var nodes = []
var edges = []
while (to_visit.length > 0) {
    let from_ = to_visit.shift()
    if (!visited.has(from_)) {
        let to = from_.toString().split('').map(digit => parseInt(digit) * parseInt(digit)).reduce((accumulator, value) => accumulator + value)
		let colour = from_.toString().length <= 2 ? 'black' : 'red'
		nodes.push({id: from_, label: from_.toString(), shape: 'text', font: {size: 36, color: colour}})
		edges.push({from: from_, to: to, arrows: 'to'})
        to_visit.push(to)
        visited.add(from_)
	}
}

var container = document.getElementById('network');
var data = {
	nodes: new vis.DataSet(nodes),
	edges: new vis.DataSet(edges)
}
var options = {
	width: '800px',
	height: '800px',
	layout: { randomSeed: 394153 }
}
var network = new vis.Network(container, data, options);
