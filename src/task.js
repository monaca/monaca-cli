var BaseTask = function(){};

BaseTask.prototype = {
    run: function(taskName){},
    taskList: [],
    isMyTask: function(taskName){
        for (var i = 0, l = this.taskList.length; i < l; i++) {
            var task = this.taskList[i];
            if (task === taskName) return true;
        }

        return false;
    }
};

exports.BaseTask = BaseTask;
