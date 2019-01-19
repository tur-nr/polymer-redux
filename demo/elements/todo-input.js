import { html, PolymerElement } from '@polymer/polymer/polymer-element';

export default class TodoInput extends PolymerElement {
	static get template() {
		return html`
			<style>
				input {
					font-family: Roboto;
					margin-top: 11px;
					border: 0;
					font-size: 14px;
					line-height: 22px;
					display: block;
					width: 100%;
					outline: none;
				}
			</style>
			<input
				placeholder="Type to add an item to the list..."
				on-change="handleChange"
				autofocus
			/>
		`;
	}

	handleChange(event) {
		const value = event.target.value;

		if (!value) {
			return;
		}

		this.dispatchEvent(
			new CustomEvent('add-task', {
				detail: event.target.value,
				bubbles: true,
				composed: true
			})
		);

		event.target.value = '';
		event.target.focus();
	}
}

customElements.define('todo-input', TodoInput);
