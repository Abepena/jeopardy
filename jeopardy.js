const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

//TODO: Steps --> 0: clue.value --> 1: clue.question --> 2: clue.answer ---> blank or Which team got it? (buttons)

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // Total categories in the API = 18408
  // We want to sample 6 from 100 randomly and offset between 0 and 18302 to cover all possible categories

  const offset = Math.floor(Math.random() * 18303);
  const { data } = await axios.get(`http://jservice.io/api/categories`, {
    params: { count: 100, offset },
  });
  const categoryIds = data.map((category) => category.id);

  return _.sampleSize(categoryIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  const { data: category } = await axios.get(
    `http://jservice.io/api/category`,
    {
      params: { id: catId },
    }
  );

  const randomClues = _.sampleSize(category.clues, NUM_QUESTIONS_PER_CAT);
  const clues = randomClues.map((clue) => ({
    question: clue.question,
    answer: clue.answer,
    showing: null,
  }));

  return { title: category.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  const $htmlCategories = $("#categories");
  const $htmlClues = $("#questions");

  //clear the categories and clues before repopulating
  $htmlCategories.empty();
  $htmlClues.empty();
  let $theadRow = $("<tr>");
  for (let category of categories) {
    const $td = $("<td>").addClass(["cell", "category"]).text(category.title);
    $theadRow.append($td);
  }
  $htmlCategories.append($theadRow);

  let clueValues = [200, 400, 600, 800, 1000];

  //Populate table rows from the category clues
  for (let clueIdx = 0; clueIdx < NUM_QUESTIONS_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    let clueValue = clueValues[clueIdx];
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      const $td = $("<td>")
        .attr("id", `${clueIdx}-${catIdx}`)
        .addClass(["cell", "value"])
        .text(`$${clueValue}`);
      $tr.append($td);
    }
    $htmlClues.append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  const id = evt.target.id;
  let [clueIdx, catIdx] = id.split("-");
  let cellText = "";

  const clue = categories[catIdx].clues[clueIdx];
  const $cell = $(`#${clueIdx}-${catIdx}`);

  if (!clue.showing) {
    $cell.removeClass("value").addClass("question");
    clue.showing = "question";
    cellText = clue.question;
  } else if (clue.showing === "question") {
    $cell.removeClass("question").addClass("answer");
    clue.showing = "answer";
    cellText = clue.answer;
  } else {
    // Exit handler if answer is already showing
    return;
  }

  //Update cellText
  $cell.html(cellText);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  $("#loading").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#loading").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  $("#board").hide();
  showLoadingView();
  const categoryIds = await getCategoryIds();
  categories = await Promise.all(
    categoryIds.map((catId) => getCategory(catId))
  );
  fillTable();
  hideLoadingView();
  $("#board").show();
}

/** On click of start / restart button, set up game. */
$("#start-restart").on("click", setupAndStart);
// TODO

/** On page load, add event handler for clicking clues */
$(async function () {
  setupAndStart();
  $("#board").on("click", "td", handleClick);
});
