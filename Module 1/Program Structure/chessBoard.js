let size = 8;
let board = "";

for (let row = 0; row < size; row++) {
  for (let col = 0; col < size; col++) {
    board += (row + col) % 2 === 0 ? " " : "#";
  }
  board += "\n";
}

console.log(board);
