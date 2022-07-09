const fullPopup = document.getElementById("fullPopup")
function newTodoItem() {
    fullPopup.style.display = "block"
}

form = /*html*/`
  <form action="/dashboard/add-todo-item" method="post">
  ...
  inputs
  ...
  <button type="submit">
  </form>
`