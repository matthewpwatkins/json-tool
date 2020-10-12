const DEFAULT_OBJ = {
  lastName: "Doe",
  householdMembers: [
    {
      name: "John",
      isPerson: true,
      isHead: true,
      age: 30,
    },
    {
      name: "Fido",
      isPerson: false,
    },
    {
      name: "Jeb",
      isPerson: true,
      age: 0,
    },
    {
      name: "Jack",
      isPerson: true,
      age: 4,
    },
    {
      name: "Jill",
      isPerson: true,
      age: 2,
    },
    {
      name: "Jane",
      isPerson: true,
      isHead: true,
      age: 28,
    },
  ],
};

function transform(obj) {
  for (const member of obj.householdMembers) {
    member.name = `${member.name} ${obj.lastName}`;
  }

  const result = {
    family: {},
  };

  result.family.heads = obj.householdMembers
    .filter(m => m.isHead)
    .sort((a, b) => a.age - b.age);
  result.family.children = obj.householdMembers
    .filter(m => m.isPerson && !m.isHead)
    .sort((a, b) => a.age - b.age);

  return result;
}

function getFunctionBody(fn) {
  try {
    const fnString = fn.toString();
    const functionBodyString = fnString.slice(fnString.indexOf("{") + 1, fnString.lastIndexOf("}"));
    let skipChars = 0;
    for (let i = 0; i < functionBodyString.length; i++) {
      const c = functionBodyString.charAt(i);
      if (c !== "\r" && c !== "\n") {
        break;
      }
      skipChars++;
    }
    return functionBodyString.substring(skipChars);
  } catch (err) {
    throw 'Could not read function body. ' + err;
  }
}

const DEFAULT_TRANSFORM_FUNCTION_BODY_STRING = transform.toString();
const EDITORS_BY_ID = {};

$(function () {
  // Render the editors
  for (const editorElement of $(".ace-editor")) {
    const editorSelectorElement = $(editorElement);
    const isReadOnlyValue = editorSelectorElement.attr('ace-read-only');
    const isReadOnly = typeof isReadOnlyValue !== typeof undefined && isReadOnlyValue !== false;
    const minLines = parseInt(editorSelectorElement.attr('ace-min-lines'));
    const maxLines = parseInt(editorSelectorElement.attr('ace-max-lines'));

    const editor = ace.edit(editorElement, {
      theme: "ace/theme/twilight",
      mode: "ace/mode/" + editorSelectorElement.attr("ace-language"),
      minLines: minLines,
      maxLines: maxLines,
      wrap: true,
      autoScrollEditorIntoView: true,
      readOnly: isReadOnly,
      showPrintMargin: false
    });
    EDITORS_BY_ID[editorSelectorElement.attr("id")] = editor;
  }

  // Bind the file menu options
  $('.btn-file-open').click(function() {
    const fileSelector = $('#' + $(this).attr('file-input-target'));
    fileSelector.click();
  });

  $('.btn-file-save').click(function() {
    const editor = EDITORS_BY_ID[$(this).attr('editor-target')];
    const code = editor.getValue();
    download(code, $(this).attr('file-name'), 'application/json');
  });

  // Handle file uploads
  $('.hidden-file-selector').change(function (changeEvent) {
    const targetEditor = EDITORS_BY_ID[$(this).attr('editor-target')];
    const fileReader = new FileReader();
    fileReader.addEventListener('load', loadEvent => {
      targetEditor.setValue(loadEvent.target.result, -1);
    });
    fileReader.readAsText(changeEvent.target.files[0]);
  });

  // Populate default values
  EDITORS_BY_ID['editor-input'].setValue(JSON.stringify(DEFAULT_OBJ, null, 2), -1);
  EDITORS_BY_ID['editor-transform'].setValue(DEFAULT_TRANSFORM_FUNCTION_BODY_STRING, -1);

  const performTransform = () => {
    console.log('In perform transform');
    let operation;
    let consoleLine;
    try {
      operation = 'reading JSON input';
      const inputText = EDITORS_BY_ID['editor-input'].getValue();
      if (!inputText) {
        throw 'No input JSON specified';
      }

      operation = 'parsing JSON input';
      const inputObject = JSON.parse(inputText);
      if (!inputObject) {
        throw 'Could not parse input as JSON';
      }

      operation = 'parsing transform function';
      const transformFunctionText = EDITORS_BY_ID['editor-transform'].getValue();
      if (!transformFunctionText) {
        throw 'No transform JS specified';
      }

      operation = 'building transform function';
      const transformFunction = new Function("obj", getFunctionBody(transformFunctionText));

      operation = 'transforming the input object';
      const resultObject = transformFunction(inputObject);
      if (!resultObject) {
        throw 'The result transformed object was ' + resultObject;
      }

      operation = 'serializing the input object';
      const resultObjectJSON = JSON.stringify(resultObject, null, 2) || '';

      operation = null;
      EDITORS_BY_ID['editor-output'].setValue(resultObjectJSON, -1);
      consoleLine = 'Transformed successfully';
    } catch (err) {
      console.error(operation, err);
      EDITORS_BY_ID['editor-output'].setValue('', -1);
      consoleLine = `ERROR ${operation}\n${err}`;
    }

    const consoleEditor =  EDITORS_BY_ID['editor-console'];
    const existingLines = consoleEditor.session.getLength();
    const prepend = existingLines > 1 || consoleEditor.getValue().trim().length > 0 ? '\n' : ''
    consoleEditor.session.insert({
      row: consoleEditor.session.getLength(),
      column: 0
    }, `${prepend}${new Date().toISOString()}: ${consoleLine}`);
  };

  performTransform();

  $('#btn-transform').click(performTransform);

  $('#btn-console-clear').click(function() {
    EDITORS_BY_ID['editor-console'].setValue('', -1);
  });
});
