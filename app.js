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

function DEFAULT_TRANSFORM(obj) {
  for (const member of obj.householdMembers) {
    member.name = `${member.name} ${obj.lastName}`;
  }

  const result = {
      family: {}
  };

  result.family.heads = obj.householdMembers
    .filter(m => m.isHead)
    .sort((a, b) => a.age - b.age);
  result.family.children = obj.householdMembers
    .filter(m => m.isPerson && !m.isHead)
    .sort((a, b) => a.age - b.age);
    
  return result;
}

function getBody(fn) {
  const fnString = fn.toString();
  const functionBodyString = fnString.slice(fnString.indexOf("{") + 1, fnString.lastIndexOf("}"));
  let skipChars = 0;
  for (let i = 0; i < functionBodyString.length; i++) {
    const c = functionBodyString.charAt(i);
    if (c !== '\r' && c !== '\n') {
        break;
    }
    skipChars++;
  }
  return functionBodyString.substring(skipChars);
}

const DEFAULT_TRANSFORM_FUNCTION_BODY_STRING = getBody(DEFAULT_TRANSFORM);

$(function () {
  const inputEditor = $("#input-editor");
  const transformEditor = $("#transform-editor");
  const resultEditor = $("#result-editor");

  inputEditor.text(JSON.stringify(DEFAULT_OBJ, null, 2));
  transformEditor.text(DEFAULT_TRANSFORM_FUNCTION_BODY_STRING);

  const transform = () => {
    const inputObject = JSON.parse(inputEditor.text());
    const transformFunction = new Function("obj", `${transformEditor.text()}\nreturn transform(obj);`);
    const resultObject = transformFunction(inputObject);
    resultEditor.text(JSON.stringify(resultObject, null, 2));
  };

  inputEditor.keyup(() => {
    transform();
  });
  transformEditor.keyup(() => {
    transform();
  });

  transform();
});