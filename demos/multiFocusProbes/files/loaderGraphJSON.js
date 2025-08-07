/**
 * Reads filepath of .json file and extracts properties see above in multiline description.
 * @param {*} filePath Path to json file.
 * @returns Array of multiline objects.
 */
function loadGraphJSON(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status == 200) {
    // Store all data
    var data = {
      vertices: [],
      edges: []
    }

    // Read whole text
    result = xmlhttp.responseText;

    // Split vertices and edges
    let verticesEdges = result.split('],');

    //
    // Process vertices
    //
    // VerticesRaw is array of players
    let verticesRaw = verticesEdges[0].split('},');
    for (let i = 0; i < verticesRaw.length; i++) {
      // New node for a player
      var vertex = {
        label: "",
        appearance: 0,
        mins_played: 0,
        ball_recovery: 0,
        pass_inaccurate: 0,
        pass_accurate: 0,
        foul_committed: 0,
        foul_given: 0,
        yellow_card: 0,
        red_card: 0,
        shots_total: 0,
        goals: 0,
        neighbors: []
      }

      // VerticesRawElements is array of attributes per player i
      let verticesRawElements = verticesRaw[i].split(',');
      for (let j = 1; j < verticesRawElements.length; j++) {
        // elementPair is attribute pair j for player i
        // We start w/ j = 1 as j = 0 which is id but not needed anyway
        // as the ids are stored in the consecutive storage of vertices and
        // the first attribute pair of the first player is of size 3 (all others of size 2)
        let elementPair = verticesRawElements[j].split(':');

        // Get and clean value
        let value = cleanString(elementPair[1]);

        // Assign value
        if (elementPair[0].includes("label")) {
          vertex.label = value;
        }
        else if (elementPair[0].includes("appearance")) {
          vertex.appearance = parseInt(value);
        }
        else if (elementPair[0].includes("mins_played")) {
          vertex.mins_played = parseInt(value);
        }
        else if (elementPair[0].includes("ball_recovery")) {
          vertex.ball_recovery = parseInt(value);
        }
        else if (elementPair[0].includes("pass_inaccurate")) {
          vertex.pass_inaccurate = parseInt(value);
        }
        else if (elementPair[0].includes("pass_accurate")) {
          vertex.pass_accurate = parseInt(value);
        }
        else if (elementPair[0].includes("foul_committed")) {
          vertex.foul_committed = parseInt(value);
        }
        else if (elementPair[0].includes("foul_given")) {
          vertex.foul_given = parseInt(value);
        }
        else if (elementPair[0].includes("yellow_card")) {
          vertex.yellow_card = parseInt(value);
        }
        else if (elementPair[0].includes("red_card")) {
          vertex.red_card = parseInt(value);
        }
        else if (elementPair[0].includes("shots_total")) {
          vertex.shots_total = parseInt(value);
        }
        else if (elementPair[0].includes("goals")) {
          vertex.goals = parseInt(value);
        }
      }

      data.vertices.push(vertex);
    }

    //
    // Process vertices
    //
    // EdgeRaw is array edges
    let edgesRaw = verticesEdges[1].split('},');

    // Process first edge differently
    let edge = edgesRaw[0].split(',');
    let vertexOne = parseInt(cleanString(edge[0].split(':')[2]));
    let vertexTwo = parseInt(cleanString(edge[1].split(':')[1]));
    data.edges.push([vertexOne, vertexTwo]);

    // Process remaining edges
    for (let i = 1; i < edgesRaw.length; i++) {
      let edge = edgesRaw[i].split(',');
      let vertexOne = parseInt(cleanString(edge[0].split(':')[1]));
      let vertexTwo = parseInt(cleanString(edge[1].split(':')[1]));
      data.edges.push([vertexOne, vertexTwo]);

      // Add as neighbor in respective arrays of vertices
      data.vertices[vertexOne].neighbors.push(vertexTwo);
      data.vertices[vertexTwo].neighbors.push(vertexOne);
    }
  }

  return data;
}

/**
 * Removes certain substrings from provided string.
 * @param {*} value String we want to modify.
 * @returns Modified string.
 */
function cleanString(value) {
  while (value.includes("\""))
    value = value.replace("\"", "");
  value = value.trim();
  return value;
}

// Export load file
export { loadGraphJSON }