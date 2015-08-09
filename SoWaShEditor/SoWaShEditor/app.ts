class LevelGrid {
    //elements
    outputElement: HTMLDivElement;

    //variables
    columns: number;
    rows: number;

    container: number[][];
    rotationContainer: number[][];

    constructor(private element: HTMLElement) {
        this.columns = 0;
        this.rows = 7;
        this.outputElement = <HTMLDivElement>element.querySelector('#output-section');

        this.container = new Array<Array<number>>();
        this.rotationContainer = new Array<Array<number>>();
        this.AddColumns(15);
        this.RenderOutput();
        this.RenderDesigner();

        var columnCountElement = <HTMLInputElement>element.querySelector("#column-count");
        columnCountElement.value = this.columns.toString();
        columnCountElement.onchange = this.OnColumnCounterChange.bind(this);

        var rowCountElement = <HTMLInputElement>element.querySelector("#row-count");
        rowCountElement.value = this.rows.toString()
        rowCountElement.onchange = this.OnRowCounterChange.bind(this);

        //fileupload
        (<HTMLButtonElement> this.element.querySelector('#upload')).onclick = this.OnFileUploadClicked.bind(this);
        (<HTMLButtonElement> this.element.querySelector('#download')).onclick = this.OnFileDownload.bind(this);
    }

    private AddRows(count: number) {
        for (var col = 0; col < this.columns; col++) {
            var column = this.container[col];
            for (var row = 0; row < count; row++) {
                column.push(0);
            }
        }
        this.rows += count;
    }
    private RemoveRows(count: number) {
        for (var col = 0; col < this.columns; col++) {
            var column = this.container[col];
            for (var row = 0; row < count; row++) {
                column.splice(-1, 1);
            }
        }
        this.rows -= count;
    }

    private AddColumns(count: number) {
        for (var i = 0; i < count; i++) {
            this.container.push(new Array<number>(this.rows));
            this.rotationContainer.push(new Array<number>(this.rows));
            this.columns++;
            for (var j = 0; j < this.rows; j++)
                this.container[this.container.length - 1][j] = 0;
        }
    }
    private RemoveColumns(count: number) {
        for (var i = 0; i < count; i++) {
            this.container.splice(-1, 1);
            this.rotationContainer.splice(-1, 1);
            this.columns--;
        }
    }

    //Events
    private OnColumnCounterChange(event: Event) {
        var target = <HTMLInputElement>event.currentTarget;
        var value: number = parseInt(target.value);
        value = this.ClipValue(value, target);

        if (value < this.columns)
            this.RemoveColumns(Math.abs(value - this.columns));
        else if (value > this.columns)
            this.AddColumns(value - this.columns);
        this.RenderOutput();
        this.RenderDesigner();
    }

    private OnRowCounterChange(event: Event) {
        var target = <HTMLInputElement>event.currentTarget;
        var value: number = parseInt(target.value);
        value = this.ClipValue(value, target);
        if (value < this.rows)
            this.RemoveRows(Math.abs(value - this.rows));
        else if (value > this.rows)
            this.AddRows(value - this.rows);
        this.RenderOutput();
        this.RenderDesigner();
    }
    private ClipValue(value: number, target: HTMLInputElement): number {
        if (value <= 0) {
            value = 1;
            target.value = value.toString();
        }
        return value;
    }

    private RenderDesigner() {
        var designSection = <HTMLDivElement>this.element.querySelector('#design-section');
        designSection.innerHTML = "";
        designSection.style.width = (this.columns * 46).toString() + "px";
        designSection.style.height = (this.rows * 46).toString() + "px";
        for (var i = 0; i < this.columns; i++) {
            var columnEl = <HTMLDivElement>document.createElement('div');
            columnEl.className = "design-column";
            for (var j = 0; j < this.rows; j++) {
                var cell = new Dropdown(i, j, this.OnChangeDesignDropdown.bind(this), this.container[i][j], this.rotationContainer[i][j]);
                columnEl.appendChild(cell.RenderElement());
            }
            designSection.appendChild(columnEl);
        }
    }

    private OnChangeDesignDropdown(caller: Dropdown) {
        this.container[caller.columnPosition][caller.rowPosition] = caller.currentItem.sprite.id;
        if (caller.currentItem.sprite.hasRotation)
            this.rotationContainer[caller.columnPosition][caller.rowPosition] = caller.currentItem.rotation;
        else
            this.rotationContainer[caller.columnPosition][caller.rowPosition] = undefined;
        this.RenderOutput();
    }

    private RenderOutput(): void {
        var output: string = "";
        for (var i = -1; i <= this.rows; i++) {
            for (var j = -1; j <= this.columns; j++) {
                if (j > -1)
                    output += " " + this.GetTileText(j, i);
                else
                    output += this.GetTileText(j, i);
            }
            output += ";\n";
        }
        this.outputElement.innerText = output;
    }

    private GetTileText(col: number, row: number): string {
        if (col < 0 || row < 0 || col >= this.columns || row >= this.rows)
            return "1";
        var rotation = (this.rotationContainer[col][row] != undefined) ? "." + this.rotationContainer[col][row].toString() : "";
        return this.container[col][row].toString() + rotation;
    }

    /******************************** File Loading ***********************************/
    OnFileUploadClicked(event: Event) {
        if (!FileReader)
            return;
        var input = <HTMLInputElement>this.element.querySelector('#file');
        var reader = new FileReader();
        if (input.files.length) {
            var textFile = input.files[0];
            reader.readAsText(textFile);
            reader.onload = this.ProcessFile.bind(this);
        } else {
            alert('Please choose a file before continuing')
        }
    }

    private ProcessFile(event: Event) {
        var file = <String>(<FileReader>event.target).result,
            results;
        if (file && file.length) {
            this.container = [];
            this.rotationContainer = [];

            var rows = file.split(";");
            rows.pop();
            rows.pop();
            rows.shift();
            for (var row = 0; row < rows.length; row++) {
                rows[row] = rows[row].replace(/\s+/gi, " ");
                var columns = rows[row].split(" ");
                columns.pop();
                columns.shift();
                columns.shift();
                for (var col = 0; col < columns.length; col++) {
                    var cell = columns[col];
                    if (!this.container[col]) {
                        this.container[col] = new Array<number>(rows.length);
                        this.rotationContainer[col] = new Array<number>(rows.length);
                    }
                    if (~cell.indexOf(".")) {
                        var cellArray = cell.split(".");
                        this.container[col][row] = parseInt(cellArray[0]);
                        this.rotationContainer[col][row] = parseInt(cellArray[1]);
                    } else {
                        this.container[col][row] = parseInt(cell);
                    }
                }
            }
            this.columns = this.container.length;
            this.rows = this.container[0].length;
            try {
                this.RenderOutput();
            } catch (e) {
                console.log(e);
            };
            this.RenderDesigner();
            (<HTMLInputElement>this.element.querySelector("#column-count")).value = this.columns.toString();
            (<HTMLInputElement>this.element.querySelector("#row-count")).value = this.rows.toString();
        }
    }

    OnFileDownload(event: Event) {
        var fileName = (<HTMLInputElement>this.element.querySelector('#filename')).value;
        if (!fileName.length)
            fileName = "LevelXX.txt";
        if (~fileName.search(".txt"))
            fileName += ".txt";
        var text = this.outputElement.innerText;
        var dElement = <HTMLAnchorElement>document.createElement('a');
        dElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        dElement.setAttribute('download', fileName);

        dElement.style.display = 'none';
        document.body.appendChild(dElement);

        dElement.click();

        document.body.removeChild(dElement);
    }
}

class DropdownItem {
    templateElement = document.querySelector('#dropdown-item-template');
    sprite: SpriteDef;

    rotation: number;

    element: HTMLDivElement;
    constructor(public parent: Dropdown, spriteNumber: number, currentRotation?: number) {
        this.sprite = SpriteDefinitions[spriteNumber];

        if (this.sprite.hasRotation)
            this.rotation = currentRotation || 0;

        this.MakeElement();
    }

    private MakeElement() {
        this.element = <HTMLDivElement>this.templateElement.querySelector('.dropdown-item').cloneNode(true);
        var image = <HTMLImageElement>this.element.querySelector('.dropdown-item-image');
        image.src = this.sprite.image;

        if (this.sprite.hasRotation) {
            var rotationButton = <HTMLDivElement>this.element.querySelector('.rotation-button');
            rotationButton.onclick = this.OnClickRotate.bind(this);
            this.RotateItem();
            rotationButton.style.display = "block";
        }
    }

    private RotateItem() {
        var imageElement = <HTMLImageElement>this.element.querySelector('img');
        if (this.rotation >= this.sprite.rotationIds.length)
            this.rotation = 0;
        imageElement.style.transform = "rotate(" + -90 * this.sprite.rotationIds[this.rotation] + "deg)";
    }

    OnClickRotate(event: Event) {
        event.stopImmediatePropagation();
        if (!this.sprite.hasRotation) return;
        this.rotation++;
        this.RotateItem();
        this.parent.OnRotate();
    }

    RenderFullElement(): HTMLDivElement {
        return this.element;
    }

    RenderListElement(): HTMLImageElement {
        return <HTMLImageElement>this.element.querySelector('img').cloneNode();
    }
}

class Dropdown {
    templateElement = document.querySelector('#dropdown-template');

    currentItem: DropdownItem;
    list: DropdownItem[] = [];

    element: HTMLDivElement;
    constructor(public columnPosition: number, public rowPosition: number, public onchange: any, currentItemId?: number, currentItemRotation?: number) {
        currentItemId = currentItemId || 0;
        currentItemRotation = currentItemRotation || 0;
        this.MakeElement(currentItemId, currentItemRotation);
    }

    private MakeElement(currentItemId: number, currentItemRotation: number) {
        this.element = <HTMLDivElement>this.templateElement.querySelector('.dropdown').cloneNode(true);

        for (var i = 0; i < SpriteDefinitions.length; i++) {
            this.list.push(new DropdownItem(this, i, currentItemRotation));
        }
        this.currentItem = this.list[currentItemId];
        this.currentItem.rotation = currentItemRotation;
    }

    RenderElement(): HTMLDivElement {
        //build dropdown
        var listContainer = <HTMLDivElement>this.element.querySelector('.item-list');
        for (var i = 0; i < this.list.length; i++) {
            var listElement = this.list[i].RenderListElement();
            listElement.className = "item-" + i;
            listElement.onclick = this.OnClickListElement.bind(this);
            listContainer.appendChild(listElement);
        }

        //build current
        var current = <HTMLDivElement>this.element.querySelector('.current-item');
        current.innerHTML = "";
        current.appendChild(this.currentItem.RenderFullElement());
        (<HTMLImageElement> current.querySelector('img')).onclick = this.OnClickCurrent.bind(this);

        return this.element;
    }

    OnRotate() {
        this.onchange(this);
    }

    private OnClickCurrent(event: Event) {
        //event.preventDefault();
        var listContainer = <HTMLDivElement>this.element.querySelector('.item-list');
        if (listContainer) {
            listContainer.style.top = this.element.offsetTop.toString();
            listContainer.style.left = this.element.offsetLeft.toString();
            listContainer.style.display = "block";
        }
    }

    private OnClickListElement(event: Event) {
        event.preventDefault();
        var listContainer = <HTMLDivElement>this.element.querySelector('.item-list');
        if (listContainer)
            listContainer.style.display = "none";

        var target = <HTMLDivElement>event.currentTarget;
        this.currentItem = this.list[parseInt(target.className.split('-')[1])];

        var current = <HTMLDivElement>this.element.querySelector('.current-item');
        current.innerHTML = "";
        current.appendChild(this.currentItem.RenderFullElement());
        current.onclick = this.OnClickCurrent.bind(this);

        this.onchange(this);
    }
}

interface SpriteDef {
    name: string;
    id: number;
    hasRotation: boolean;
    rotationIds?: number[];
    image?: string;
}

var SpriteDefinitions: SpriteDef[] = [
    { name: "Ground", id: 0, hasRotation: false, image: '/images/empty.png' },
    { name: "Wall", id: 1, hasRotation: false, image: '/images/wall.png' },
    { name: "Ball", id: 2, hasRotation: false, image: '/images/ball.png' },
    { name: "End", id: 3, hasRotation: false, image: '/images/ziel.png' },
    { name: "Slope", id: 4, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/slope.png' },
    { name: "LineBorder", id: 5, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/line_border.png' },
    { name: "LineMiddle", id: 6, hasRotation: true, rotationIds: [0, 1], image: '/images/line_middle.png'},
    { name: "HalfSlopeR", id: 7, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/slope_half.png' },
    { name: "BigHalfSlopeR", id: 8, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/slope_half_big.png' },
    { name: "HalfSlopeL", id: 9, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/slope_half_l.png' },
    { name: "BigHalfSlopeL", id: 10, hasRotation: true, rotationIds: [0, 1, 2, 3], image: '/images/slope_half_big_l.png' }
]

window.onload = () => {
    var el = document.getElementById('content');
    new LevelGrid(el);
};