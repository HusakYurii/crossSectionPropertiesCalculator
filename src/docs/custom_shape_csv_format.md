# Custom Shape CSV File Format

This page describes the CSV file that you can import in the custom shape form. The file holds the outline of a shape. Each row is one point. You can import the file instead of clicking the points on the canvas.

The idea in short:

1.  **One row, one point.** Each row has two numbers, $x$ and $y$. The rows go around the outline in order.
2.  **The layout is flexible.** You may add a header row. The app skips blank lines in the file. You may use a semicolon or a tab instead of a comma. In semicolon and tab files you may use a decimal comma.
3.  **The content is strict.** If one row is wrong, the app refuses the whole file. The message names the line. The canvas does not change.

---

## 1. What the file is for and where it is used

In the custom shape form, the **CSV file** field has an **Import** button. The button opens a file picker that offers `.csv` files. The points of the file you choose replace the points on the canvas.

Then solve the points with the **Calculate with FEM** button. It uses the algorithm in "Cross-Section Properties via a Triangle Mesh (FEM)". The custom shape form is the only place that reads a CSV file.

Use the file to bring in an outline that was drawn or measured elsewhere. For example, it can come from a spreadsheet or from a CAD program that can export its vertices.

---

## 2. File structure

*   The file is a text file with the extension `.csv`.
*   Each row is one point: the $x$ value and the $y$ value.
*   The rows follow the outline, clockwise or counterclockwise.
*   The first row may be a header. The app skips the first row if neither value is a number, such as `x,y`. An empty cell is not a number, so `x,` is a header too. Blank lines before it do not matter. The row `x,1` is not a header, because `1` is a number. The app refuses it (section 8).

Every file example in a box has two sides:

*   **Left:** what you could see in your table in Excel. Each box is a cell.
*   **Right:** the raw text of the saved `.csv` file. A text editor shows it exactly like this. The app reads this text.

A minimal file for a rectangle $40 \times 20$:

<div class="csv-example">
<div class="csv-example__label">In Excel (your table)</div>
<div class="csv-example__label">Saved .csv file (raw text)</div>
<table class="csv-sheet">
<tr><th></th><th>A</th><th>B</th></tr>
<tr><th>1</th><td class="csv-sheet__text">x</td><td class="csv-sheet__text">y</td></tr>
<tr><th>2</th><td>0</td><td>0</td></tr>
<tr><th>3</th><td>40</td><td>0</td></tr>
<tr><th>4</th><td>40</td><td>20</td></tr>
<tr><th>5</th><td>0</td><td>20</td></tr>
</table>
<pre class="csv-raw">x,y
0,0
40,0
40,20
0,20</pre>
</div>

<small>**Note: every row has exactly two values.** The app refuses a row with one value or with three values. The header row follows the same rule, so `x,y,z` is refused too. Only empty cells at the end of a row are ignored (section 5).</small>

---

## 3. Separators

The app reads the first row that is not blank. It looks for a separator in that row, in the order of the table below. Every other row must use the same separator.

| The first row has | Separator | Decimal mark |
| --- | --- | --- |
| a semicolon `;` | semicolon | dot or comma |
| no semicolon, but a tab | tab | dot or comma |
| neither | comma `,` | dot only |

A spreadsheet in a language with a decimal comma usually saves the file with semicolons between the values. You can import such a file as it is. The app reads `0,5` as $0.5$.

<div class="csv-example">
<div class="csv-example__label">In Excel (your table)</div>
<div class="csv-example__label">Saved .csv file (raw text)</div>
<table class="csv-sheet">
<tr><th></th><th>A</th><th>B</th></tr>
<tr><th>1</th><td class="csv-sheet__text">x</td><td class="csv-sheet__text">y</td></tr>
<tr><th>2</th><td>0,5</td><td>1,5</td></tr>
<tr><th>3</th><td>40,5</td><td>1,5</td></tr>
</table>
<pre class="csv-raw">x;y
0,5;1,5
40,5;1,5</pre>
</div>

In a comma file the decimal mark must be a dot. In the next file, `1,5,2,5` is four values, not two. The app refuses it. Write `1.5` and `2.5`, or save the file with semicolons.

<div class="csv-example">
<div class="csv-example__label">In Excel (your table)</div>
<div class="csv-example__label">Saved .csv file (raw text)</div>
<table class="csv-sheet">
<tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
<tr><th>1</th><td>1</td><td>5</td><td>2</td><td>5</td></tr>
</table>
<pre class="csv-raw">1,5,2,5</pre>
</div>

The table shows what the app sees: four separate values.

<small>**Note: in a semicolon or tab file, a comma is always a decimal mark.** The app reads `1,000` as $1.000$, which is $1$, not one thousand. Do not use thousands separators in the file.</small>

---

## 4. Numbers

A value must be a plain number:

*   an optional sign, `+` or `-`,
*   digits with an optional decimal part, for example `12`, `12.5`, `12.` or `.5`,
*   an optional exponent, for example `1e3` or `2.5E-2`.

The app **refuses** these:

*   hexadecimal numbers (`0x1F`), `Infinity` and `NaN`,
*   empty cells in a point row,
*   numbers with a unit (`12 mm`),
*   thousands separators made of a space or an apostrophe (`1 000`, `1'000`).

Do not use a comma as a thousands separator. The app may read a wrong value and show no error:

*   In a comma file, the comma starts a new value. The row `1,000` is read as the point $(1,\ 0)$. The row `1,000,000` has three values and is refused.
*   In a semicolon or tab file, `1,000` is read as $1$ (see the note in section 3). `1,000,000` is refused.

Spaces around a value are ignored.

---

## 5. What is tolerated

*   **Blank lines**, anywhere in the file, are skipped. Error messages still count them (section 8).
*   **Quotes around a value**, as in `"12","7"`, are removed. The quotes must surround the whole value. A quoted value must not contain the separator.
*   **A byte order mark** at the start of the file, which some programs write, is ignored.
*   **Any kind of line break**: Windows (`\r\n`), Unix (`\n`) or old Mac (`\r`).
*   **Empty cells at the end of a row**, as in `1,2,`, are ignored. A spreadsheet may add them. The row must still have two values, so `1,` is refused.

The app accepts both rows of this file. The points are $(12,\ 7)$ and $(1,\ 2)$. Each row ends with a comma because of the empty column C:

<div class="csv-example">
<div class="csv-example__label">In Excel (your table)</div>
<div class="csv-example__label">Saved .csv file (raw text)</div>
<table class="csv-sheet">
<tr><th></th><th>A</th><th>B</th><th>C</th></tr>
<tr><th>1</th><td>12</td><td>7</td><td></td></tr>
<tr><th>2</th><td>1</td><td>2</td><td></td></tr>
</table>
<pre class="csv-raw">12,7,
1,2,</pre>
</div>

Some programs write `"12","7"`. The app reads this as `12,7`.

An empty row in your table is different. Excel saves it as `,` or `;`, not as a blank line, and the app refuses that row. Delete empty rows before you save. Blank lines appear only in files made with a text editor or another program.

---

## 6. What happens on import

When the app accepts the file, it does these steps in this order:

1.  **Rounding.** Every value is rounded to a whole number, because the custom shape editor works with whole numbers. Halves round up: $2.5$ becomes $3$ and $-2.5$ becomes $-2$. A value such as $-0.3$ becomes $0$, never $-0$.
2.  **The closing point is dropped.** If the last point equals the first point, the app removes the last point, because a shape closes itself. The app compares the points **after** rounding. So a last point that rounds to the first point is removed too.
3.  **The points replace the ones on the canvas.** The app clears the earlier points, the selection, the old results and the old mesh.
4.  **The view is fitted** to the imported shape.

The rounding removes detail from a shape in small units, such as meters. So the outline must be made of larger numbers.

<small>**Note: units.** The calculation does not depend on units. But the app labels every length as mm, and the other shapes on the canvas are entered in mm. Write the file in millimeters. If the file uses another unit, the results are in that unit but still labelled mm, and the shape will not match shapes entered in mm.</small>

---

## 7. The polygon the points must describe

The app checks the format of the file, not the geometry. The geometry must be right for the FEM solver:

*   **At least 3 points** are needed to calculate. A file with 1 or 2 points is still imported, but you cannot calculate it. The form shows "A shape needs at least 3 points." and the **Calculate with FEM** button stays disabled. Remember that the closing point is dropped: the rows `1,1`, `2,2`, `1,1` give 2 points.
*   **One simple polygon, without holes.** The outline is one closed ring. Its edges do not cross each other. The app does **not** check this. The FEM solver gives no error either. It calculates a self-intersecting outline without a message, and the results may be all zeros or simply wrong. Section 1 of "Cross-Section Properties via a Triangle Mesh (FEM)" states this requirement.
*   **A hole** cannot be written in the file. Make the hole with a separate custom shape (or any other shape) set as negative. Place it inside the positive one.

---

## 8. Errors

If the file is refused, a notification shows the reason. The app stops at the first wrong line. It imports nothing: the points on the canvas stay as they were.

| Message | Cause |
| --- | --- |
| The file is empty. | The file has no rows, or only blank lines. |
| Line N: expected 2 values (x and y), found M. | Row N has M values instead of 2. N counts every line of the file, including blank lines. |
| Line N: "..." is not a pair of numbers. | Row N has two values, but at least one is not a number. The text of the row is shown between the quotes. |
| No points found in the file. | The file has only a header row. |
| The file has more than 10000 points. | There are more than 10000 point rows. The header does not count. |

The app counts the points while it reads the file, before it removes the closing point. So it refuses a file with 10001 point rows, even if the last row repeats the first. The limit stops a wrong file from freezing the page.

If you close the file picker without choosing a file, nothing happens.

---

## 9. Summary and worked example

1.  Put one point per row, $x$ and $y$, in the order around the outline (section 2).
2.  Separate the values with a comma, a semicolon or a tab. The first row decides (section 3).
3.  Use plain numbers (section 4). A header, blank lines and quotes are fine (section 5).
4.  Expect whole numbers and no closing point after import (section 6).
5.  Make sure the outline is one simple polygon of 3 or more points (section 7).

### Worked example: L-shape

An L-shape with a header row, decimal values, and a last row that closes the outline:

<div class="csv-example">
<div class="csv-example__label">In Excel (your table)</div>
<div class="csv-example__label">Saved .csv file (raw text)</div>
<table class="csv-sheet">
<tr><th></th><th>A</th><th>B</th></tr>
<tr><th>1</th><td class="csv-sheet__text">x</td><td class="csv-sheet__text">y</td></tr>
<tr><th>2</th><td>0</td><td>0</td></tr>
<tr><th>3</th><td>60</td><td>0</td></tr>
<tr><th>4</th><td>60</td><td>20</td></tr>
<tr><th>5</th><td>20</td><td>20</td></tr>
<tr><th>6</th><td>20</td><td>80</td></tr>
<tr><th>7</th><td>0</td><td>80</td></tr>
<tr><th>8</th><td>0.4</td><td>-0.3</td></tr>
</table>
<pre class="csv-raw">x,y
0,0
60,0
60,20
20,20
20,80
0,80
0.4,-0.3</pre>
</div>

*   The first row is `x,y`. Neither value is a number, so it is the header. The app skips it.
*   The separator is a comma, because the first row has no semicolon and no tab. There are 7 point rows.
*   After rounding, the last row `0.4,-0.3` becomes $(0,\ 0)$, because $0.4$ rounds to $0$ and $-0.3$ rounds to $0$.
*   That equals the first point $(0,\ 0)$, so the app removes the last point.

**Result:** these are the 6 points the app imports. The header row and the closing row are gone.

<table class="csv-sheet">
<tr><th>Point</th><th>x</th><th>y</th></tr>
<tr><th>1</th><td>0</td><td>0</td></tr>
<tr><th>2</th><td>60</td><td>0</td></tr>
<tr><th>3</th><td>60</td><td>20</td></tr>
<tr><th>4</th><td>20</td><td>20</td></tr>
<tr><th>5</th><td>20</td><td>80</td></tr>
<tr><th>6</th><td>0</td><td>80</td></tr>
</table>

### Summary of the rules

| Item | Rule |
| --- | --- |
| Header row | skipped when it is the first non-blank row and neither value is a number |
| Separator | from the first non-blank row: `;`, else tab, else `,` |
| Decimal comma | only in semicolon and tab files |
| Rounding | to whole numbers, before the closing point is checked |
| Closing point | dropped when the last point equals the first |
| Point limit | 10000, header not counted |
| Minimum to calculate | 3 points |
