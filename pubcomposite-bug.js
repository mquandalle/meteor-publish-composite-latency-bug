// We have two collection with a 1..n relation between them.
// There is a list of `Tasks` to do, and some `Workers` each being assigned to
// a single task.
Tasks = new Mongo.Collection('tasks');
Workers = new Mongo.Collection('workers');

if (Meteor.isServer) {
  Meteor.startup(function () {
    // If the database is empty we feed it with one worker and two tasks
    if (Tasks.find().count() === 0) {
      Tasks.insert({_id: "taskA", title: "Work harder"});
      Tasks.insert({_id: "taskB", title: "Play harder"});
      Workers.insert({_id: "workerA", name: "Max", task: "taskA"});
    }
  });

  // We publish all tasks, and for each task, publish the workers that work on
  // that task -- if any.
  Meteor.publishComposite('tasks', function () {
    return {
      find: function () {
        return Tasks.find();
      },
      children: [
        {
          find: function (task) {
            return Workers.find({tasks: task._id});
          }
        }
      ]
    }
  });
}

if (Meteor.isClient) {
  // Subscribe to the composite publication defined above
  Meteor.subscribe('tasks');

  // For the purpose of this example we hard-code the identifier of the current
  // worker
  var currentWorkerId = "workerA";

  // We display the name of the current work and the task he is being assigned
  // to.
  UI.body.helpers({
    worker: function() {
      var currentWorker = Workers.findOne(currentWorkerId);
      return currentWorker && currentWorker.name;
    },
    task: function() {
      var currentWorker = Workers.findOne(currentWorkerId);
      return currentWorker && Tasks.findOne(currentWorker.task).title;
    }
  });

  // After a few seconds we change the task our worker is being assigned to. If
  // he was worker on task A, we give him task B, and vice versa.
  setTimeout(function () {
    var currentWorker = Workers.findOne(currentWorkerId);
    var newTask = currentWorker.task === "taskA" ? "taskB" : "taskA";
    Workers.update("workerA", {$set: {task: newTask}});
  }, 5 * 1000);
}
