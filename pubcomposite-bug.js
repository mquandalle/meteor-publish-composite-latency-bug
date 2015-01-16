// We have two collection with a 1..n relation between them.
// There is a list of `Tasks` to do, and some `Workers` each being assigned to
// a single task.
Tasks = new Mongo.Collection('tasks');
Workers = new Mongo.Collection('workers');

if (Meteor.isServer) {
  Meteor.startup(function () {
    // If the database is empty we feed it with one worker and two tasks
    if (Tasks.find().count() === 0) {
      Tasks.insert({_id: "taskA"});
      Tasks.insert({_id: "taskB"});
      _.times(30, function(n) {
        Workers.insert({
          _id: "worker" + n,
          name: "Worker " + n,
          task: "taskA"});
      });
    }
  });

  // We publish all tasks, and for each task, publish the workers that work on
  // that task -- if any.
  Meteor.publish('tasks', function () {
    return Tasks.find();
  });

  Meteor.publish('workersForTask', function (taskId) {
    check(taskId, String);
    return Workers.find({task: taskId});
  });
}

if (Meteor.isClient) {
  // Subscribe to the composite publication defined above
  Meteor.subscribe('tasks');

  Meteor.subscribe('workersForTask', "taskA");
  Meteor.subscribe('workersForTask', "taskB");

  // We display the name of the current work and the task he is being assigned
  // to.
  UI.body.helpers({
    workers: function() {
      return Workers.find();
    }
  });

  // After a few seconds we change the task our worker is being assigned to. If
  // he was worker on task A, we give him task B, and vice versa.
  setTimeout(function () {
    var currentWorker = Workers.findOne('worker1');
    var newTask = currentWorker.task === "taskA" ? "taskB" : "taskA";
    Workers.find().forEach(function(worker) {
      Workers.update(worker._id, {$set: {task: newTask}});
    });
  }, 5 * 1000);
}
