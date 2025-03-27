exports.up = async function (knex) {
  return knex.schema.createTable('messages', table => {
    table.string('id').primary()
    table.string('dialogId').notNullable()
    table.string('senderId').notNullable()
    table.boolean('delivered').notNullable()
    table.enum('type', ['text', 'image', 'video']).notNullable()
    table.text('content').nullable()
    table.text('caption').nullable()
    table.string('imageUrl').nullable()
    table.string('videoUrl').nullable()
    table.string('thumbnailUrl').nullable()
    table.integer('duration').nullable()
    table.bigInteger('createdAt').notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
}

exports.down = async function (knex) {
  return knex.schema.dropTable('messages')
}
