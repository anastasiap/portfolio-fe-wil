import { Injectable } from '@angular/core';
import { WheelStateCategory } from '../../../state/typings';

interface WheelInterface {
  getData(): UserData;
  handleSelection(e: MouseEvent): void;
}

// Label interface for storing label properties for drawing
interface Label {
  angle?: number;
  color: string;
  coord: number;
  name: string;
  radius: number;
  startingPoint?: number;
}

// Arc interface for storing arc properties for drawing
interface Arc {
  arc: Path2D;
  name: string | number;
  arcType: string;
}

// User data interface for storing selected category and score
interface UserData {
  categoryID: string;
  score: number;
}

// Coordinates interface for mouse position
interface Coords {
  x: number;
  y: number;
}

const fontSpec = '700 25px "Amatic SC"'; // match ctx.font exactly (weight/style/size + quoted family)

const fontLoadCache = new Map<string, Promise<boolean>>();

async function ensureFontLoaded(spec = fontSpec) {
  // Memoise by spec so we don’t re-wait on future redraws

  if (fontLoadCache.has(spec)) {
    return fontLoadCache.get(spec);
  }

  // Ask the FontFaceSet to load the *exact* face needed for the size/weight/style
  const p = (async () => {
    // This triggers the fetch if not already in progress.
    await document.fonts.load(spec);
    // Wait until the set settles so the face is "active"
    await document.fonts.ready;
    return true;
  })();

  fontLoadCache.set(spec, p);
  return p;
}

// Main Wheel class implementing the WheelInterface interface
@Injectable()
export class WheelService implements WheelInterface {
  private data!: UserData;
  private canvas!: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private categories: WheelStateCategory[] = [];
  private scoreSystem = 8;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;
  private arcs: Arc[] = [];

  /**
   * initializes the wheel with canvas, categories, and score system.
   * Sets up drawing context, center, radius, and draws the wheel.
   */
  public createWheel(canvas: HTMLCanvasElement, categories: WheelStateCategory[], scoreSystem: number): WheelService {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Use CSS dimensions instead of canvas pixel dimensions
    const rect = canvas.getBoundingClientRect();
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
    this.radius = (rect.width - 100) / 2;

    this.categories = categories;
    this.scoreSystem = scoreSystem;

    this.setData({ categoryID: '0', score: 0 });

    this.drawWheel();

    return this;
  }

  /**
   * Returns the current user data (selected category and score)
   */
  public getData(): UserData {
    return this.data;
  }

  /**
   * Handles click events on the wheel, updates selected category and score based on click position.
   * Fills the selected score arc for visual feedback.
   */
  public handleSelection(e: MouseEvent): { score: number; categoryId: string } {
    const scoresCollection: Arc[] = [];
    const coords: Coords = this.getCursorPosition(e);

    this.arcs.forEach((a: Arc) => {
      if (!this.ctx) return;

      if (this.ctx.isPointInPath(a.arc, coords.x, coords.y)) {
        if (a.arcType === 'category') {
          // @ts-expect-error: types to be fixed
          this.data.categoryID = a.name;
        }

        if (a.arcType === 'score') {
          scoresCollection.push(a);
        }
      }
    });

    const scoreArc = scoresCollection[0];

    this.data.score = scoreArc.name as number;

    // for mark arcs - names are used as a MARK
    // On click, fill the arc with its assigned color (not a shade)
    // Find the category color
    const category = this.categories.find((cat) => cat.id === this.data.categoryID);

    if (category) {
      this.fillArc(category.color, scoreArc.arc);
    } else {
      this.fillArc('rgba(0,0,0, 0.15)', scoreArc.arc);
    }

    return { score: this.data.score, categoryId: this.data.categoryID };
  }

  /**
   * Draws the entire wheel, including category arcs and scores, and places labels.
   * Each category is drawn as an arc, and scores are drawn as sub-arcs within each category.
   */
  private drawWheel(): void {
    if (!this.ctx) return;
    // set the start at the top of a circle
    let startingPoint = -0.5 * Math.PI;

    // assume sum of all arcs is 100%
    const total = 100;
    const arcLength = total / this.categories.length;

    // store the position of each label
    const labels: Label[] = [];

    // font settings for labels
    const fontSize = Math.floor(this.canvas.height / 33);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `${fontSize} * 3 px Didact Gothic`;

    // iterate through categories to draw arcs
    this.categories.forEach((category) => {
      const arcAngle = (arcLength / total) * 2 * Math.PI;

      this.drawArc(this.radius, startingPoint, arcAngle, category.id, category.color, 'category');
      this.drawScores(category, startingPoint, arcAngle);

      // save settings for current arc label if placed inside the wheel
      const coordinates = startingPoint + arcAngle / 2 + Math.PI * 2;
      const labelRadius = (this.radius * 3) / 4;

      labels.push({
        angle: arcAngle,
        color: category.color,
        coord: coordinates,
        name: category.name,
        radius: labelRadius,
        startingPoint,
      });

      // move starting point to the end of current arc
      startingPoint += arcAngle;
    });

    // Draw separator lines between arcs
    this.ctx.save();
    this.ctx.strokeStyle = '#cbc6c6';
    this.ctx.lineWidth = 1;
    const sepStart = -0.5 * Math.PI;
    const sepArcAngle = (2 * Math.PI) / this.categories.length;
    for (let i = 0; i < this.categories.length; i++) {
      const angle = sepStart + i * sepArcAngle;
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(this.centerX + this.radius * Math.cos(angle), this.centerY + this.radius * Math.sin(angle));
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Draw a border around the entire wheel
    this.ctx.save();
    this.ctx.strokeStyle = '#cbc6c6';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.restore();

    this.addLabels(labels);
  }

  /**
   * Draws an arc (either category or score) on the canvas and saves its path for hit detection.
   * @param radius - radius of the arc
   * @param startingPoint - starting angle in radians
   * @param arcAngle - angle size of the arc in radians
   * @param id - identifier for the arc (category id or score number)
   * @param color - fill color
   * @param arcType - 'category' or 'score'
   */
  private drawArc(radius: number, startingPoint: number, arcAngle: number, id: string | number, color: string, arcType: string): void {
    if (!this.ctx) return;

    const endPoint = startingPoint + arcAngle;

    // create Path object to keep track of each arc
    const section = new Path2D();

    section.moveTo(this.centerX, this.centerY);
    section.arc(this.centerX, this.centerY, radius, startingPoint, endPoint);
    section.lineTo(this.centerX, this.centerY);

    // For category arcs, fill with white and stroke with dark gray
    if (arcType === 'category') {
      this.ctx.fillStyle = '#fff';
      this.ctx.fill(section);
      // No stroke here
    }

    if (arcType === 'score') {
      // For score arcs, keep existing logic (transparent or shaded)
      this.fillArc(color, section);
    }

    // save all paths for future manipulations
    const newArc: Arc = { arc: section, name: id, arcType };
    this.arcs.push(newArc);
  }

  /**
   * Draws the scores (sub-arcs) for a category, each representing a possible score/score.
   * Each score is a smaller arc within the category arc.
   * @param category - the category object
   * @param startingPoint - starting angle for the category
   * @param arcAngle - angle size for the category
   * @param scores - total number of scores
   */
  private drawScores(category: WheelStateCategory, startingPoint: number, arcAngle: number): void {
    let mark = 0;
    let scoreRadius = this.radius / this.scoreSystem;

    const currentScore = category.score;
    const scoresLabels: Label[] = [];

    while (mark < this.scoreSystem) {
      let scoreColor = 'transparent';

      // If the score is less than the currentScore, shade it; otherwise, keep transparent
      if (mark < currentScore) {
        scoreColor = category.color;
      }

      this.drawArc(scoreRadius, startingPoint, arcAngle, mark + 1, scoreColor, 'score');

      // save settings for current arc label
      const labelRadius = scoreRadius - 10;
      const coordinates = startingPoint + arcAngle / 2 + Math.PI * 2;

      scoresLabels.push({
        color: 'black',
        coord: coordinates,
        name: `${mark + 1}`,
        radius: labelRadius,
      });

      // reduce radius by fraction to draw smaller arcs for scores
      scoreRadius += this.radius / this.scoreSystem;
      mark++;
    }

    this.addLabels(scoresLabels);
  }

  /**
   * Adds labels to the wheel, either along an arc or at a specific point.
   * @param labels - array of label objects
   */
  private addLabels(labels: Label[]): void {
    labels.forEach((l: Label) => {
      const labelAngle = l.coord;
      const dx = this.centerX + l.radius * Math.cos(labelAngle);
      const dy = this.centerY + l.radius * Math.sin(labelAngle);

      // If angle and startingPoint are defined, draw text along the arc, else write at point
      if (l.angle !== undefined && l.startingPoint !== undefined) {
        this.drawTextAlongArc(l.name, l.color, l.angle, l.startingPoint);
      } else {
        this.writeText(l.color, l.name, dx, dy);
      }
    });
  }

  /**
   * Draws text along an arc for category labels, supporting multi-line labels if the text is too long for the arc.
   * @param label - text to draw
   * @param color - text color
   * @param arcAngle - angle of the arc
   * @param startingPoint - starting angle
   */
  private async drawTextAlongArc(label: string, color: string, arcAngle: number, startingPoint: number) {
    if (!this.ctx) return;

    await ensureFontLoaded(); // guarantee availability

    // Font settings (should match the rest of the wheel)
    const font = 'bold 25px Amatic SC';
    this.ctx.save(); // Save context state for drawing
    this.ctx.font = font; // Set font for drawing

    // Calculate max arc length for label (in radians)
    const maxArcLen = arcAngle * 0.95; // 95% of arc to avoid edge overflow
    // Split label into lines
    const lines = this.splitLabelToLines(label, maxArcLen, font); // Get lines that fit arc

    // Adjust radius for each line (outermost line is last)
    const lineHeight = 24; // px, adjust as needed for line spacing
    const totalLines = lines.length;

    for (let lineIdx = 0; lineIdx < totalLines; lineIdx++) {
      const line = lines[lineIdx]; // Current line to draw

      // Draw each line further OUTSIDE the arc, so last line sits on the arc
      const r = this.radius + (totalLines - 1 - lineIdx) * lineHeight;

      // Centering for this line
      const metrics = this.ctx.measureText(line); // Measure width of current line
      const textArcLen = metrics.width / r; // Calculate arc length for current line
      const labelCenter = arcAngle / 2 - textArcLen / 2; // Center line within arc

      this.ctx.save(); // Save context for this line
      this.ctx.translate(this.centerX, this.centerY); // Move to center of wheel
      this.ctx.rotate(startingPoint + Math.PI / 2 + labelCenter); // Rotate to start position for line

      // Draw each character along the arc
      for (const char of line) {
        const charWidth = this.ctx.measureText(char).width; // Measure width of character
        const charArc = charWidth / r; // Calculate arc angle for character

        this.ctx.save(); // Save context for character
        this.ctx.translate(0, -r); // Move out to radius for this line
        this.ctx.fillStyle = color; // Set text color
        this.ctx.textBaseline = 'bottom'; // Align text baseline
        this.ctx.font = font; // Set font for character
        this.ctx.fillText(char, 0, 0); // Draw character at current position
        this.ctx.restore(); // Restore context after character
        this.ctx.rotate(charArc); // Rotate for next character
      }

      this.ctx.restore(); // Restore context after line
    }

    this.ctx.restore(); // Restore context after all lines
  }

  // Helper to split label into lines that fit the arc
  private splitLabelToLines(text: string, maxArcLen: number, font: string): string[] {
    if (!this.ctx) return [];

    this.ctx.save(); // Save context state for font measurement
    this.ctx.font = font; // Set font for accurate measurement

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const item of words) {
      // Try adding next word to current line
      const testLine = currentLine ? currentLine + ' ' + item : item;
      // Measure width of test line
      const metrics = this.ctx.measureText(testLine);
      // Calculate arc length in radians for test line
      const textArcLen = metrics.width / this.radius;

      // If line too long, push current line and start new
      // Otherwise, keep adding to current line
      if (textArcLen > maxArcLen && currentLine) {
        lines.push(currentLine);
        currentLine = item;
      } else {
        currentLine = testLine;
      }
    }
    // Push last line if exists
    if (currentLine) {
      lines.push(currentLine);
    }

    this.ctx.restore();
    return lines;
  }

  /**
   * Gets the cursor position relative to the canvas.
   * @param event - mouse event
   * @returns coordinates relative to canvas
   */
  private getCursorPosition(event: MouseEvent): Coords {
    const rect = this.canvas.getBoundingClientRect();

    // Get device pixel ratio to match the scaling used in canvas setup
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Convert CSS coordinates to canvas buffer coordinates
    const x = (event.clientX - rect.left) * devicePixelRatio;
    const y = (event.clientY - rect.top) * devicePixelRatio;

    return { x, y };
  }

  /**
   * Returns the minimum value from an array of scores. (Unused in current code)
   * @param scores - array of numbers
   * @returns minimum score
   */
  private getScore(scores: number[]): number {
    return scores.reduce((acc, cur) => Math.min(acc, cur), scores[0]);
  }

  /**
   * Sets the user data (selected category and score)
   * @param selected - user data object
   */
  private setData(selected: UserData): void {
    this.data = selected;
  }

  /**
   * Fills a given arc path with the specified color.
   * @param color - fill color
   * @param target - Path2D object to fill
   */
  private fillArc(color: string, target: Path2D): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = color;
    this.ctx.fill(target);
  }

  /**
   * Writes text at a specific position on the canvas.
   * @param color - text color
   * @param text - text to write
   * @param x - x coordinate
   * @param y - y coordinate
   */
  private writeText(color: string, text: string, x: number, y: number): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }
}
