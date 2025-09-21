from backend.logic import map
from backend.logic import node

from backend.data import crud

class Main:
    def __init__(self):
        self.map = map.Map()

        locations = crud.get_all_nodes()

        for loc in locations:
            self.map.add_node(node.Node(loc[0], loc[1], loc[2]))

        edges = crud.get_all_edges()

        for edge in edges:
            self.map.add_edge(self.map.get_node(edge[0]), self.map.get_node(edge[1]), edge[2])
            
    def get_nodes(self):
        return self.map.nodes.keys()
    
    def navigate(self, start_str, end_str):
        start = self.map.get_node(start_str)
        end = self.map.get_node(end_str)

        return self.map.navigation_distance(start, end)
