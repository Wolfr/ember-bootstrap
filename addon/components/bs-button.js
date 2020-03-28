import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { equal, or } from '@ember/object/computed';
import Component from '@glimmer/component';
import sizeClass from 'ember-bootstrap/utils/cp/size-class';
import typeClass from 'ember-bootstrap/utils/cp/type-class';
import { hasBootstrapVersion } from 'ember-bootstrap/compatibility-helpers';
import { arg } from 'ember-arg-types';

/**
  Implements a HTML button element, with support for all [Bootstrap button CSS styles](http://getbootstrap.com/css/#buttons)
  as well as advanced functionality such as button states.

  ### Basic Usage

  ```hbs
  <BsButton @type="primary" @icon="glyphicon glyphicon-download">
    Downloads
  </BsButton>
  ```

  ### Actions

  Use the `onClick` property of the component to send an action to your controller. It will receive the button's value
  (see the `value` property) as an argument.

  ```hbs
  <BsButton @type="primary" @icon="glyphicon glyphicon-download" @onClick=(action "download")>
    Downloads
  </BsButton>
  ```

  ### Promise support for automatic state change

  When returning a Promise for any asynchronous operation from the `onClick` closure action the button will
  manage an internal state ("default" > "pending" > "fulfilled"/"rejected") automatically.

  The button is disabled by default if it's in pending state. You could override this behavior by passing
  the `disabled` HTML attribute or by setting `@preventConcurrency` to false.

  ```hbs
  <BsButton
    disabled={{false}}
  />
  ```

  ```hbs
  <BsButton
    @preventConcurrency={{false}}
  />
  ```

  The label could be changed automatically according to the state of the promise with `@defaultText`,
  `@pendingText`, `@fulfilledText` and `@rejectedText` arguments:

  ```hbs
  <BsButton
    @type="primary"
    @icon="glyphicon glyphicon-download"
    @defaultText="Download"
    @pendingText="Loading..."
    @fulfilledText="Completed!"
    @rejectedText="Oups!?"
    @onClick={{this.download}}
  />
  ```

  ```js
  // controller.js
  import { Controller } from '@ember/controller';
  import { action } from '@ember/object';

  export default class MyController extends Controller {
    @action
    download(value) {
      return new Promise(...);
    }
  });
  ```

  For further customization `isPending`, `isFulfilled`, `isRejected` and `isSettled` properties are yielded:

  ```hbs
  <BsButton @onClick=(action "download") as |button|>
    Download
    {{#if button.isPending}}
      <span class="loading-spinner"></span>
    {{/if}}
  </BsButton>
  ```

  You can `reset` the state represented by these properties and used for button's text by setting `reset` property to
  `true`.

  @class Button
  @namespace Components
  @extends Ember.Component
  @public
*/
export default class Button extends Component {
  /**
   * Default label of the button. Not need if used as a block component
   *
   * @property defaultText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which is pending.
   * Not considered if used as a block component.
   *
   * @property pendingText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which succeeded.
   * Not considered if used as a block component.
   *
   * @property fulfilledText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which failed.
   * Not considered if used as a block component.
   *
   * @property rejectedText
   * @type string
   * @public
   */

  /**
   * Property to disable the button only used in internal communication
   * between Ember Boostrap components.
   *
   * @property _disabled
   * @type ?boolean
   * @default null
   * @private
   */
  @arg _disabled = null;

  get __disabled() {
    if (this._disabled !== null) {
      return this._disabled;
    }

    return this.isPending && this.preventConcurrency;
  }

  /**
   * Set the type of the button, either 'button' or 'submit'
   *
   * @property buttonType
   * @type String
   * @default 'button'
   * @deprecated
   * @public
   */
  @arg buttonType = 'button';

  /**
   * Set the 'active' class to apply active/pressed CSS styling
   *
   * @property active
   * @type boolean
   * @default false
   * @public
   */
  @arg active = false;

  /**
   * Property for block level buttons
   *
   * See the [Bootstrap docs](http://getbootstrap.com/css/#buttons-sizes)
   * @property block
   * @type boolean
   * @default false
   * @public
   */
  @arg block = false;

  /**
   * A click event on a button will not bubble up the DOM tree if it has an `onClick` action handler. Set to true to
   * enable the event to bubble
   *
   * @property bubble
   * @type boolean
   * @default false
   * @public
   */
  @arg bubble = false;

  /**
   * If button is active and this is set, the icon property will match this property
   *
   * @property iconActive
   * @type String
   * @public
   */
  @arg iconActive = null;

  /**
   * If button is inactive and this is set, the icon property will match this property
   *
   * @property iconInactive
   * @type String
   * @public
   */
  @arg iconInactive = null;

  /**
   * Class(es) (e.g. glyphicons or font awesome) to use as a button icon
   * This will render a <i class="{{icon}}"></i> element in front of the button's label
   *
   * @property icon
   * @type String
   * @public
   */
  get icon() {
    return this.args.icon || (this.active ? this.iconActive : this.iconInactive);
  }

  /**
   * Supply a value that will be associated with this button. This will be send
   * as a parameter of the default action triggered when clicking the button
   *
   * @property value
   * @type any
   * @public
   */
  @arg value = null;

  /**
   * Controls if `onClick` action is fired concurrently. If `true` clicking button multiple times will not trigger
   * `onClick` action if a Promise returned by previous click is not settled yet.
   *
   * This does not affect event bubbling.
   *
   * @property preventConcurrency
   * @type Boolean
   * @default true
   * @public
   */
  @arg preventConcurrency = true;

  /**
   * State of the button. The button's label (if not used as a block component) will be set to the
   * `<state>Text` property.
   * This property will automatically be set when using a click action that supplies the callback with a promise.
   * Possible values are: "default" > "pending" > "fulfilled" / "rejected".
   * It could be reseted by `reset` property.
   *
   * @property state
   * @type String
   * @default 'default'
   * @private
   */
  @tracked state = 'default';

  /**
   * Promise returned by `onClick` event is pending.
   *
   * @property isPending
   * @type Boolean
   * @private
   */
  @equal('state', 'pending')
  isPending;

  /**
   * Promise returned by `onClick` event has been succeeded.
   *
   * @property isFulfilled
   * @type Boolean
   * @private
   */
  @equal('state', 'fulfilled')
  isFulfilled;

  /**
   * Promise returned by `onClick` event has been rejected.
   *
   * @property isRejected
   * @type Boolean
   * @private
   */
  @equal('state', 'rejected')
  isRejected;

  /**
   * Promise returned by `onClick` event has been succeeded or rejected.
   *
   * @property isFulfilled
   * @type Boolean
   * @private
   */
  @or('isFulfilled', 'isRejected')
  isSettled;

  /**
   * Set this to `true` to reset the `state`. A typical use case is to bind this attribute with ember-data isDirty flag.
   *
   * The old value is not taken into consideration. Setting a `true` value to `true` again will also reset `state`.
   * In that case it's even to notify the observer system that the property has changed by calling
   * [`notifyPropertyChange()`](https://www.emberjs.com/api/ember/3.2/classes/EmberObject/methods/notifyPropertyChange?anchor=notifyPropertyChange).
   *
   * @property reset
   * @type boolean
   * @public
   */

  /**
   * Property for size styling, set to 'lg', 'sm' or 'xs'
   *
   * Also see the [Bootstrap docs](https://getbootstrap.com/docs/4.3/components/buttons/#sizes)
   *
   * @property size
   * @type String
   * @public
   */
  @arg
  size = null;

  @sizeClass('btn', 'size')
  sizeClass;

  /**
   * Property for type styling
   *
   * For the available types see the [Bootstrap docs](https://getbootstrap.com/docs/4.3/components/buttons/)
   *
   * @property type
   * @type String
   * @default 'secondary'
   * @public
   */
  @arg
  type = hasBootstrapVersion(4) ? 'secondary' : 'default';

  /**
   * Property to create outline buttons (BS4+ only)
   *
   * @property disabled
   * @type boolean
   * @default false
   * @public
   */
  @arg
  outline = false;


  @typeClass('btn', 'type')
  typeClass;

  /**
   * When clicking the button this action is called with the value of the button (that is the value of the "value" property).
   *
   * Return a promise object, and the buttons state will automatically set to "pending", "resolved" and/or "rejected".
   * This could be used to automatically set the button's text depending on promise state (`defaultText`, `pendingText`,
   * `fulfilledText`, `rejectedText`) and for futher customization using the yielded `isPending`, `isFulfilled`,
   * `isRejected` properties.
   *
   * The click event will not bubble up, unless you set `bubble` to true.
   *
   * @event onClick
   * @param {*} value
   * @public
   */
  @arg onClick = null;

  /**
   * This will reset the state property to 'default', and with that the button's label to defaultText
   *
   * @method resetState
   * @private
   */
  @action
  resetState() {
    this.state = 'default';
  }

  get text() {
    return this.args[`${this.state}Text`] || this.args.defaultText;
  }

  /**
   * @method click
   * @private
   */
  @action
  handleClick(e) {
    let onClick = this.onClick;
    let preventConcurrency = this.preventConcurrency;

    if (onClick === null || onClick === undefined) {
      return;
    }

    if (!preventConcurrency || !this.isPending) {
      let promise = (onClick)(this.value);
      if (promise && typeof promise.then === 'function' && !this.isDestroyed) {
        this.state = 'pending';
        promise.then(() => {
          if (!this.isDestroyed) {
            this.state = 'fulfilled';
          }
        }, () => {
          if (!this.isDestroyed) {
            this.state = 'rejected';
          }
        }
        );
      }
    }

    if (!this.bubble) {
      e.stopPropagation();
    }
  }
}
