import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createDistinctChunkIds } from '../createDistinctChunkIds.js'

describe('createDistinctChunkIds', function () {
  it('creates unique ids', function () {
    const ids = createDistinctChunkIds(['a', 'a', 'b', 'b', 'b'])
    expect(ids).to.eql(['a_1', 'a_2', 'b_1', 'b_2', 'b_3'])
  })

  it('creates unique ids from number ids', function () {
    const ids = createDistinctChunkIds([1, 1, 2, 2, 2])
    expect(ids).to.eql(['1_1', '1_2', '2_1', '2_2', '2_3'])
  })
})
