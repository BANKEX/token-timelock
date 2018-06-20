pragma solidity ^0.4.0;

library SortedLinkedList {

  struct Node {
    uint next;
    //        uint prev;
    uint value;
  }

  struct SLL{
    mapping (uint => Node) sll;
    uint HEAD;
  }

  // returns node with specific key
  function getNode(SLL storage self, uint _key) internal view returns(Node){
    return self.sll[_key];
  }

  // checks if node with specified key exists
  function isNodeExist(SLL storage self, uint _key) internal view returns(bool) {
    // root node always exists
    if(_key == 0) {return true;}
    if(_key == self.HEAD) {return true;}

    Node memory node = self.sll[_key];
    return (node.next != 0);
  }

  // get next node
  // convenient way to iterate over list
  function stepForward(SLL storage self, Node _currentNode) internal view returns(Node) {
    return getNode(self, _currentNode.next);
  }


  function insert(SLL storage self, uint _prevNodeKey, uint _key, uint _value) internal returns (uint) {
    require(isNodeExist(self, _prevNodeKey));

    if( _prevNodeKey == self.HEAD) {
      return push(self, _key, _value);
    }

    uint nextKey = self.sll[_prevNodeKey].next;

    // check that order is kept
    require(_prevNodeKey > _key && nextKey < _key);

    self.sll[_prevNodeKey].next = _key;
    //        self.sll[nextKey].prev = _key;

    self.sll[_key] = Node({
      next: nextKey,
      //            prev: _prevNodeKey,
      value: _value
      });

    return nextKey;
  }

  // attach node to the HEAD
  function push(SLL storage self, uint _key, uint _value) private returns (uint) {
    self.sll[self.HEAD].next = _key;

    self.sll[_key] = Node({
      next: 0,
      value: _value
      });

    self.HEAD = _key;

    return 0;
  }

  // change node value
  function updateNodeValue(SLL storage self, uint _key, uint _newValue) internal {
    require(isNodeExist(self, _key));

    self.sll[_key].value = _newValue;
  }

  // connect "from" and "to" nodes and remove all nodes in between
  function cut(SLL storage self, uint _from, uint _to) internal {
    require(isNodeExist(self, _from));
    require(isNodeExist(self, _to));
    require(_from < _to);


    Node memory node = getNode(self, _from);
    uint nextNodeKey = node.next;

    while(nextNodeKey != _to) {
      node = stepForward(self, node);

      delete self.sll[nextNodeKey];
      nextNodeKey = node.next;
    }

    _sew(self, _from, _to);
  }


  // internal method; all data has to be pre validated
  function _sew(SLL storage self, uint _from, uint _to) private {
    self.sll[_from].next = _to;
  }


  // connects nodes
  // _from.next = _to and _to.prev = _from;
  function sew(SLL storage self, uint _from, uint _to) internal {
    require(isNodeExist(self, _from));
    require(isNodeExist(self, _to));
    require(_from < _to);

    _sew(self, _from, _to);
  }



  function isEmpty(SLL storage self) internal view returns(bool) {
    return(self.HEAD == 0);
  }

}
