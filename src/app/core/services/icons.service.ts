import { Injectable } from '@angular/core';
import {
  Download,
  House,
  LayoutList,
  MapPin,
  Menu,
  Power,
  StarIcon,
  Users,
  Utensils,
} from 'lucide-angular';

@Injectable({
  providedIn: 'root',
})
export class IconsService {
  readonly logout = Power;
  readonly menu = Menu;
  readonly house = House;
  readonly users = Users;
  readonly categories = StarIcon;
  readonly restaurants = Utensils;
  readonly branches = MapPin;
  readonly products = LayoutList;
  readonly download = Download;
}
