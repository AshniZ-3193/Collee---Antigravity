export function getColleeWeirpackFiles(): Map<string, string> {
  const files = new Map<string, string>();

  files.set(
    'manifest.json',
    JSON.stringify(
      {
        author: 'Collee',
        version: '1.0.0',
        description: 'Collee grammar extensions for common essay mistakes.',
        license: 'MIT',
      },
      null,
      2,
    ),
  );

  files.set(
    'SubjectPronounAfterWent.weir',
    `
expr main <(me went), me>

let message "Use the subject pronoun \`I\` here."
let description "Corrects object pronoun \`me\` when used as sentence subject before \`went\`."
let kind "Grammar"
let becomes "I"
let strategy "Exact"

test "Me went to the store." "I went to the store."
test "me went to the store." "I went to the store."
allows "Give this to me."
`.trim(),
  );

  files.set(
    'ToStoreAfterMovementVerb.weir',
    `
expr main <([go, goes, went, going, gone, walk, walks, walked, walking, drive, drives, drove, driven, riding, ride, rides, rode] to store), store>

let message "Add \`the\` before \`store\` in this context."
let description "Adds the definite article in common movement-verb phrases like \`went to store\`."
let kind "Grammar"
let becomes "the store"
let strategy "Exact"

test "I went to store." "I went to the store."
test "We drive to store every Friday." "We drive to the store every Friday."
allows "I need to store data."
`.trim(),
  );

  return files;
}
