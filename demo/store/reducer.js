const initial = {
	tasks: [
		{
			done: false,
			task: 'Add more items to this list'
		}
	]
};

export default (state = initial, action) => {
	switch (action.type) {
		case 'ADD_TASK':
			return Object.assign({}, state, {
				tasks: state.tasks.concat([
					{
						task: action.task,
						done: false
					}
				])
			});

		case 'UPDATE_TASK_DONE': {
			const index = action.index;
			const tasks = state.tasks.concat();

			tasks.splice(
				index,
				1,
				Object.assign({}, tasks[index], {
					done: action.done
				})
			);

			return Object.assign({}, state, {
				tasks
			});
		}

		case 'REMOVE_TASK': {
			const index = action.index;
			const tasks = state.tasks.concat();

			tasks.splice(index, 1);

			return Object.assign({}, state, {
				tasks
			});
		}

		default:
			return state;
	}
};
