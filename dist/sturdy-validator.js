/*
 *  Sturdy Validator - v0.0.1
 *  A validator that just works.
 *  https://github.com/sturdynut/sturdy-validator
 *
 *  Made by Matti Salokangas
 *  Under MIT License
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    root.SturdyValidator = factory(root.jQuery);
  }

}(this, function ($) {
  "use strict";

  // Singleton Instance
  var _instance = null;
  var _createInstance = function() {
    return new ValidatorFactory();
  };
  var getInstance = function() {
    return _instance || (_instance = _createInstance());
  };

  //
  // Validator Factory
  //
  var ValidatorFactory = function() {};
  $.extend(ValidatorFactory.prototype, {
    settings: {
      DATA_PREFIX: 'data-sturdy-val-',
      DATA_SELECTOR: '[data-sturdy-val]',
      DATA_TYPE: 'sturdy-val',
      DATA_ON: 'sturdy-val-on',
      enabled: true,
      defaultEvent: 'blur',
      defaultType: 'email',
      pluginEnabled: false,
      success: function($el) {
        $el.addClass('sturdy-val-success').removeClass('sturdy-val-error');
      },
      fail: function($el) {
        $el.addClass('sturdy-val-error').removeClass('sturdy-val-success');
      },
      error: function(e) { console.log(e); }
    },
    _validators: [],
    _sturdyValElements: [],
    init: function (options) {
      options = $.extend({}, getInstance().settings, options);

      var sturdyValElements = $(options.DATA_SELECTOR);
      var needSturdy = sturdyValElements && sturdyValElements.length > 0;
      var watch = getInstance()._watchElement;

      if (needSturdy) {
        this._sturdyValElements = sturdyValElements.toArray();
        this._sturdyValElements.forEach(function(el) {
          watch(el);
        });
      }
    },
    push: function(type, fn) {
      this._validators.push(new BaseValidator(type, fn));
    },
    _watchElement: function(el) {
      var $el = el.jquery ? el : $(el),
          events = getInstance()._getEventsForElement($el),
          type = $el.data(getInstance().settings.DATA_TYPE),
          defaultEvents = getInstance()._getEventsForType(type);

      var on = defaultEvents.concat(events.filter(function (e) {
        return defaultEvents.indexOf(e) < 0;
      })).join(' ');

      $el.on(on, function() {
        getInstance()._validate($el, type, $el.val());
      });
    },
    _getEventsForElement: function($el) {
      var on = $el.data(getInstance().settings.DATA_ON);
      if (on) {
        on = on.split(',');
      }
      return on || [];
    },
    _getEventsForType: function(type) {
      var defaultEvents = ['blur'];
      if (type === 'form') {
        defaultEvents = ['submit'];
      }
      return defaultEvents;
    },
    _validate: function ($el, type, value) {
      var settings = getInstance().settings;
      var validator = getInstance()._lookup(type);
      try {
        var isValid = validator.validate(value);
        if (isValid) {
          settings.success($el);
        }
        else {
          settings.fail($el);
        }
      } catch(e) {
        settings.error(e);
      }
    },
    _lookup: function (type) {
      var index = getInstance()._validators.map(function(validator) {
        return validator.type;
      }).indexOf(type);
      return getInstance()._validators[index];
    }
  });

  //
  // Base Validator
  //
  var BaseValidator = function (type, isValid) {
    this.type = type;
    if (isValid) {
      this.isValid = isValid;
    }
  };
  $.extend(BaseValidator.prototype, {
    isValid: function () {
      throw new Error('Validate is not implemented.');
    },
    _isMatch: function (value, regex) {
      return regex.test(value);
    }
  });

  //
  // Validators
  //

  // Address
  getInstance().push('address', function(value) {
    return value.length > 5;
  });

  // Credit Card
  getInstance().push('credit-card', function(value) {
    if (/[^0-9-\s]+/.test(value)) {
      return false;
    }
    // The Luhn Algorithm. It's so pretty.
    // creds: https://gist.github.com/DiegoSalazar/4075533
    var nCheck = 0, nDigit = 0, bEven = false;
    value = value.replace(/\D/g, '');

    for (var n = value.length - 1; n >= 0; n--) {
      var cDigit = value.charAt(n);
      nDigit = parseInt(cDigit, 10);

      if (bEven && (nDigit *= 2) > 9) {
        nDigit -= 9;
      }

      nCheck += nDigit;
      bEven = !bEven;
    }

    return (nCheck % 10) === 0;
  });

  // Date
  getInstance().push('date', function(value) {
    return this._isMatch(value, /^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  // Email
  getInstance().push('email', function(value) {
    return this._isMatch(value,
      /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/);
  });

  // Phone
  getInstance().push('phone', function(value) {
    return this._isMatch(value,
      /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
  });

  // Social Security
  getInstance().push('social-security', function(value) {
    return this._isMatch(value, /^\d{3}-\d{2}-\d{4}$/);
  });

  // Time
  getInstance().push('time', function(value) {
    return this._isMatch(value, /^\d{1,2}:\d{2}([ap]m)?$/);
  });

  // Form
  getInstance().push('form', function(value) {
    var isValid = true;

    return isValid;
  });

  return getInstance();
}));
