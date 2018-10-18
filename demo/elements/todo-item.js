import { html, PolymerElement } from '@polymer/polymer/polymer-element';

export default class TodoInput extends PolymerElement {
	static get template() {
		return html`
			<style>
				.container {
					display: flex;
					align-items: center;
					padding: 11px 0;
					border-bottom: 1px solid #EAEDF3;
					font-size: 14px;
					line-height: 22px;
					color: #3E3F42;
				}

				.text {
					margin-left: 10px;
					flex: 1;
					user-select: none;
				}

				.text.done {
					text-decoration: line-through;
				}

				.remove {
					border: 0;
					background: transparent;
					cursor: pointer;
					font-weight: 500;
					font-size: 14px;
					color: #9EA0A5;
					display: none;
					outline: none;
					height: 16px;
					width: 16px;
					padding: 0;
					text-align: center;
					line-height: 16px;
				}

				.remove:hover {
					background-color: #9EA0A5;
					border-radius: 50%;
					color: white;
				}

				.container:hover .remove {
					display: block;
				}

				input[type=checkbox] {
					cursor: pointer;
				}
			</style>
			<div class="container">
				<input
					type="checkbox"
					title="Mark as done"
					checked$="[[done]]"
					on-change="handleDone"
				/>
				<div class$="[[getTaskClass(done)]]">
					<slot></slot>
				</div>
				<button
					class="remove"
					title="Remove item"
					on-click="handleDelete">
					&times;
				</button>
			</div>
		`;
	}

	static get properties() {
		return {
			done: Boolean,
			index: Number
		};
	}

	getTaskClass(done) {
		return done ? 'text done' : 'text';
	}

	handleDone(event) {
		this.dispatchEvent(
			new CustomEvent('updateTaskDone', {
				detail: {
					index: this.index,
					done: event.target.checked
				},
				bubbles: true,
				composed: true
			})
		);
	}

	handleDelete() {
		this.dispatchEvent(
			new CustomEvent('removeTask', {
				detail: this.index,
				bubbles: true,
				composed: true
			})
		);
	}
}

customElements.define('todo-item', TodoInput);
