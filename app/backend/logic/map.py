import math
class Map:
    def __init__(self):
        self.nodes = {}
    
    def add_node(self, node):
        if node not in self.nodes:
            self.nodes[node] = []
    
    def add_edge(self, node1, node2, cost):
        self.nodes[node1].append((node2, cost))
        self.nodes[node2].append((node1, cost))

    def get_node(self, name):
        for node in self.nodes.keys():
            if node.name == name:
                return node

    def heuristic(self, node1, node2):
        delta_lat = abs(node1.x - node2.x)
        delta_lon = abs(node1.y - node2.y)
        lat_rad = math.radians((node1.x + node2.x) / 2)
        delta_x = delta_lat * 364000 * math.cos(lat_rad)
        delta_y = delta_lon * 364000

        return ((delta_x**2) + (delta_y**2)) ** 0.5
    
    def navigation_distance(self, start, end):
        open_set = set()
        open_set.add(start)
        closed_set = set()
        parents = {}

        costs = {}
        costs[start] = 0

        while open_set:
            # Find node in open_set with lowest f = g + h
            curr_node = None
            for node in open_set:
                if curr_node is None or costs[node] + self.heuristic(node, end) < costs[curr_node] + self.heuristic(curr_node, end):
                    curr_node = node

            if curr_node == end:
                # Reconstruct path
                path = []
                total_distance = 0
                while curr_node in parents:
                    path.append(curr_node)
                    prev = parents[curr_node]
                    # Add the cost from prev -> curr to total distance
                    for nbr, cost in self.nodes[prev]:
                        if nbr == curr_node:
                            total_distance += cost
                            break
                    curr_node = prev
                path.append(start)
                return path[::-1], total_distance  # reversed path + distance

            open_set.remove(curr_node)
            closed_set.add(curr_node)

            for nbr, cost in self.nodes[curr_node]:
                if nbr in closed_set:
                    continue

                tentative_cost = costs[curr_node] + cost

                if nbr not in costs or tentative_cost < costs[nbr]:
                    costs[nbr] = tentative_cost
                    parents[nbr] = curr_node
                    open_set.add(nbr)

        return None, None  # no path found
