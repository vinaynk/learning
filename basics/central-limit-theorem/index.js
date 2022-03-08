// dont read this code - vinay

// output distribution
let output = { x : [0], y : [1], g : [0], plot: null }
let inputs = []


function EID(el) {
  return document.getElementById(el)
}


function _clearArray(arr) {
  while (arr.length) {
    arr.pop();
  }
  return arr
}


function _sumArray(arr) {
  let sm = 0
  for (let i = 0; i < arr.length; i++) {
    sm += arr[i]
  }
  return sm
}


function _normalize(arr) {
  let sm = _sumArray(arr)
  for (let i = 0; i < arr.length; i++) {
    arr[i] /= sm
  }
  return arr
}


function convolve(x, y) {
  // Not the most efficient implementation of convolution
  // But I like this one because it makes more sense
  // For each value xi in x:
  //   we replicate y with the shift and scale of xi

  let olen = x.length + y.length - 1
  // output
  let z = Array(olen).fill(0)
  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < y.length; j++) {
      z[i+j] += y[j] * x[i];
    }
  }
  return z
}


function convolution_test() {
  let x = [1, 1, 1]
  let y = [1, 2, 1]
  let z = convolve(x, y)
  console.log(z)
}


function xpand(x1, x2) {
  let xmin = x1[0] + x2[0]
  let xmax = x1[x1.length-1] + x2[x2.length-1]
  let xop  = []
  for (let x = xmin; x <= xmax; x++) {
    xop.push(x)
  }
  return xop
}


function fixTicks(obj) {
  let left  = obj.x[0]
  let right = obj.x[obj.x.length-1]
  let nticks = 32
  let step = (right - left) / nticks
  let scale = 1
  while (step > 10) {
    step = step / 10
    scale = scale * 10
  }
  if (step < 1) {
    step = 1
  } else if (step < 2) {
    step = 2
  } else if (step < 5) {
    step = 5
  } else {
    step = 10
  }
  step *= scale
  // console.log(obj.plot.options.scales.xAxes[0].ticks.stepSize)
  // obj.plot.options.scales.xAxes[0].ticks.stepSize = step
  // console.log(obj.plot.options.scales)
}


function computeGaussian(x, y) {
  let ex  = 0
  let ex2 = 0
  for (let i = 0; i < x.length; i++) {
    ex  += x[i] * y[i]
    ex2 += x[i] * y[i] * x[i]
  }
  let variance = ex2 - ex * ex
  let std = Math.sqrt(variance)

  let g = []
  let c = 1 / std / Math.sqrt(2 * Math.PI)
  for (let i = 0; i < x.length; i++) {
    let norm = (x[i] - ex) / std
    val = Math.exp(-0.5 * norm * norm) * c
    g.push(val)
  }
  return g
}


function mixDist(idx) {
  let x1 = output.x
  let y1 = output.y

  let x2 = inputs[idx].x
  let y2 = inputs[idx].y

  let xop = xpand(x1, x2)
  let yop = convolve(y1, y2)
  _normalize(yop)
  let gop = computeGaussian(xop, yop)

  _clearArray(output.x).push(...xop)
  _clearArray(output.y).push(...yop)
  _clearArray(output.g).push(...gop)
  // fixTicks(output)
  output.plot.update()
}


function resetOutput() {
  _clearArray(output.x).push(0)
  _clearArray(output.y).push(1)
  _clearArray(output.g).push(0)
  output.plot.update()
}


function createChart(elem, data, cfg={}) {
  cfg = Object.assign({ ratio : 0.3, color : '#333' }, cfg)
  EID(elem).height = Math.round(window.innerHeight * cfg.ratio)
  let extra  = []
  let legend = false
  let label  = ''
  if (data.g != null) {
    extra.push({
      lineTension: 0,
      data: data.g,
      borderColor: '#999',
      fill: false,
      label: 'Gaussian'
    })
    legend = true
    label  = 'Combined'
  }
  let ret = new Chart(elem, {
    type: "line",
    data: {
      labels: data.x,
      datasets: [{
        label: label,
        lineTension: 0,
        data: data.y,
        borderColor: cfg.color,
        fill: false
      }, ...extra]
    },
    options: {
      legend: {display: legend},
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: { suggestedMin: 0 }
        }]
      },
      elements: {
        point: {
          radius: 0
        }
      }
    }
  })

  return ret
}


function uniformDist(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim+1; i++) {
    x.push(i)
    y.push(1)
  }
  // we want either ends to be zero
  _normalize(y)
  return { x, y }
}


function butterflyDist(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim+1; i++) {
    x.push(i)
    y.push(Math.abs(i))
  }
  _normalize(y)
  return { x, y }
}


function butterflyDist2(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim-2; i++) {
    x.push(i)
    y.push(Math.abs(i))
  }
  _normalize(y)
  return { x, y }
}


function rampDist(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim+1; i++) {
    x.push(i)
    y.push(i+lim+1)
  }
  _normalize(y)
  return { x, y }
}


function twoBoxDist(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim-1; i++) {
    x.push(i)
    let val = 1
    if (Math.abs(i) < lim / 2) {
      val = 0
    }
    y.push(val)
  }
  _normalize(y)
  return { x, y }
}


function teethDist(lim) {
  let x = []
  let y = []
  for (let i = -lim-1; i <= lim-1; i++) {
    x.push(i)
    y.push((i+lim+1)%4)
  }
  _normalize(y)
  return { x, y }
}


function randomDist1(lim) {
  let x = []
  let y = []
  let p = 0
  for (let i = -lim-1; i <= lim-1; i++) {
    x.push(i)
    let val = 0
    if (Math.random() > 0.5) {
      val = 1
    }
    y.push(val)
  }
  _normalize(y)
  return { x, y, lim }
}


function randomize6() {
  let obj = inputs[6]
  let newobj = randomDist1(obj.lim)
  _clearArray(obj.y).push(...newobj.y)
  obj.plot.update()
}


function randomDist2(lim) {
  let x = []
  let y = []
  let p = 0
  for (let i = -lim-1; i <= lim+1; i++) {
    x.push(i)
    let val = 0
    y.push(Math.random())
  }
  _normalize(y)
  return { x, y, lim }
}


function randomize7() {
  let obj = inputs[7]
  let newobj = randomDist2(obj.lim)
  _clearArray(obj.y).push(...newobj.y)
  obj.plot.update()
}

function initInputs() {
  let obj = uniformDist(10)
  let clr = 'hsl(216, 98%, 52%)'
  obj.plot = createChart('input-canvas-0', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = butterflyDist(10)
  obj.plot = createChart('input-canvas-1', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = butterflyDist2(10)
  obj.plot = createChart('input-canvas-2', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = rampDist(10)
  obj.plot = createChart('input-canvas-3', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = twoBoxDist(10)
  obj.plot = createChart('input-canvas-4', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = teethDist(12)
  obj.plot = createChart('input-canvas-5', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = randomDist1(12)
  obj.plot = createChart('input-canvas-6', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
  obj = randomDist2(12)
  obj.plot = createChart('input-canvas-7', obj, { ratio: 0.2, color: clr })
  inputs.push(obj)
}


function initAll() {
  output.plot = createChart('output-canvas', output,
                            { ratio: 0.35, color: 'hsl(0, 90%, 70%)' })
  initInputs()
}


window.addEventListener('DOMContentLoaded', event => {
  console.log('poetry, epics, calculus!')

  initAll()

  // convolution_test()
})


