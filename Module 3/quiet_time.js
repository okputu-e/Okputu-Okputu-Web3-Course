async function activityTable(day) {
  let logFileList = await textFile("camera_logs.txt");
  // Your code here
}

activityTable(1).then((table) => console.log(activityGraph(table)));
