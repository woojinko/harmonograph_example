function Radians(d) {
    return d * (Math.PI / 180.0);
}

class Pendulum {
    constructor(xamplitude, yamplitude, frequency, phase, halflife) {
        this.xamplitude = xamplitude;
        this.yamplitude = yamplitude;
        this.limit = Math.max(Math.abs(xamplitude), Math.abs(yamplitude));
        this.frequency = Radians(frequency);
        this.phase = Radians(phase);
        this.decay = -Math.LN2 / halflife;
    }

    Calculate(t) {
        const x = this.xamplitude * Math.cos(this.frequency*t + this.phase);
        const y = this.yamplitude * Math.sin(this.frequency*t + this.phase);
        const radius = Math.exp(t * this.decay);
        return {x:x*radius, y:y*radius, r:radius*this.limit};
    }
}

class Harmonograph {
    constructor(pendulumList) {
        this.pendulumList = pendulumList;
    }

    Calculate(t) {
        let sum = {x:0, y:0};
        let radius = 0;
        for (let p of this.pendulumList) {
            let v = p.Calculate(t);
            sum.x += v.x;
            sum.y += v.y;
            radius = Math.max(radius, v.r);
        }
        return {x:sum.x, y:sum.y, r:radius};
    }
}

const ReservedPixelsBottom = 70;
const graph = document.getElementById("GraphCanvas");
const context = graph.getContext('2d');
const frequencySlider1 = document.getElementById('FrequencySlider1');
const frequencySlider2 = document.getElementById('FrequencySlider2');
const frequencySlider3 = document.getElementById('FrequencySlider3');

function MakeHarmonograph(time) {
    const halflife = 3000;
    const angle = 0.3 * time;
    const freq1 = parseFloat(frequencySlider1.value);
    const freq2 = parseFloat(frequencySlider2.value);
    const freq3 = parseFloat(frequencySlider3.value);

    return new Harmonograph([
        new Pendulum(220, 50, freq1, angle * 0.0101, halflife),
        new Pendulum(30, 100, freq2, 10.0 + angle * 0.0731, halflife),
        new Pendulum(100, 100, freq3, angle * 0.00134, halflife)
    ]);
}

function Render(time) {
    const harm = MakeHarmonograph(time);
    context.clearRect(0, 0, graph.width, graph.height);
    const dt = 0.5;
    let cx = graph.width / 2;
    let cy = graph.height / 2;
    const limit = 20;
    const size = Math.min(graph.width, graph.height);
    const scale = 1.45 * size / 1000;
    context.beginPath();
    for (let t=0; ; t += dt) {
        const v = harm.Calculate(t);
        if (v.r < limit) break;
        const x = scale*v.x + cx;
        const y = scale*v.y + cy;
        if (t === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }
    const gradient = context.createRadialGradient(cx, cy, limit, cx, cy, size/2);
    gradient.addColorStop(0, 'rgb(10,20,200)');
    gradient.addColorStop(0.7, 'rgb(200,100,15)');
    context.strokeStyle = gradient;
    context.stroke();

    // Render frequency slider values as text on the graph.
    context.font = '16px monospace';
    context.fillStyle = 'rgb(0,0,0)';
    const x1 = graph.width*(1/6) - 60;
    const x2 = graph.width*(1/2) - 60;
    const x3 = graph.width*(5/6) - 60;
    context.fillText('F1=' + parseFloat(frequencySlider1.value).toFixed(4), x1, graph.height-8);
    context.fillText('F2=' + parseFloat(frequencySlider2.value).toFixed(4), x2, graph.height-8);
    context.fillText('F3=' + parseFloat(frequencySlider3.value).toFixed(4), x3, graph.height-8);
}

function timerTick(time) {
    Render(time);
    requestAnimationFrame(timerTick);
}

function ResizeGraph() {
    // Make the canvas fit the available space inside the browser window.
    // Reserve some space below the graph for sliders.
    graph.width = window.innerWidth;
    graph.height = window.innerHeight - ReservedPixelsBottom;

    // Resize the sliders to fit in the reserved space beneath the graph.
    const xgap = 20;        // number of pixels of horizontal space between the sliders
    const yspace = 10;      // pixels of vertical "cushion" for sliders
    const sliderWidth = (graph.width/3 - xgap).toFixed() + 'px';
    const sliderHeight = (ReservedPixelsBottom - yspace).toFixed() + 'px';
    frequencySlider1.style.width = sliderWidth;
    frequencySlider2.style.width = sliderWidth;
    frequencySlider3.style.width = sliderWidth;
    frequencySlider1.style.height = sliderHeight;
    frequencySlider2.style.height = sliderHeight;
    frequencySlider3.style.height = sliderHeight;
}

ResizeGraph();
window.addEventListener('resize', ResizeGraph);
requestAnimationFrame(timerTick);
