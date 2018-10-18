import TodoApp from '../elements/todo-app';
import ReduxMixin from '../mixins/redux';
import { bindActionCreators } from '../../polymer-redux';

class ReduxTodo extends ReduxMixin(TodoApp) {
	/**
	 * We map any redux state to the element properties here. Feel free to use
	 * libraries like reselect to improve the performance of your app.
	 *
	 * @param {object} state The redux state object.
	 * @param {HTMLElement} element The element instance.
	 *
	 * @return {Object} Key-value map of properties and their values.
	 */
	static mapStateToProps(state, element) {
		return {
			tasks: state.tasks
		};
	}

	/**
	 * Mapping dispatch to CustomEvents that bubble from internal elements.
	 * This is only called once so make sure you bind correctly.
	 *
	 * Use the exported helper `bindActionCreators` to construct a key-value map
	 * of events that will call `dispatch` with the returning value.
	 *
	 * @param {Function} dispatch The redux dispatch function.
	 * @param {HTMLElement} element The element instance.
	 *
	 * @return {Object} Key-value map of event names and their listeners.
	 */
	static mapDispatchToEvents(dispatch, element) {
		return bindActionCreators(
			{
				addTask(event) {
					return {
						type: 'ADD_TASK',
						task: event.detail
					};
				},
				updateTaskDone(event) {
					return {
						type: 'UPDATE_TASK_DONE',
						index: event.detail.index,
						done: event.detail.done
					};
				},
				removeTask(event) {
					return {
						type: 'REMOVE_TASK',
						index: event.detail
					};
				}
			},
			dispatch
		);
	}
}

customElements.define('redux-todo', ReduxTodo);
